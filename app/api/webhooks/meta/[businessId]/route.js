import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { resolveMetaAdsCredentials } from '@/lib/meta/credentials';
import { leadManager } from '@/lib/automation/leadManager';
import { metaLog, metaError } from '@/lib/meta/logger';
import { extractLeadgenFromPayload, processMetaLeadgenWebhook } from '@/lib/meta/leadgenHandler';
import {
  recordMetaWebhookIngress,
  finalizeMetaWebhookIngress,
  collectMetaAppSecretCandidates,
  verifyMetaWebhookSignature,
  parseLeadgenFields
} from '@/lib/meta/webhookIngress';

function logStep(step, message, data) {
  metaLog(`Webhook Step ${step}`, message, data);
}

function logHeaders(headers) {
  const safe = {};
  headers.forEach((value, key) => {
    safe[key] = key.toLowerCase().includes('signature') ? `${value.slice(0, 12)}…` : value;
  });
  return safe;
}

function respond200(body, step) {
  logStep(step, 'Returning HTTP 200', body);
  return NextResponse.json(body, { status: 200 });
}

function findLeadgenChange(payload) {
  const match = extractLeadgenFromPayload(payload);
  if (!match) return null;
  return { change: { field: 'leadgen', value: match.value }, entry: null, source: match.source };
}

/**
 * GET - Meta Webhook Verification (The Challenge)
 */
export async function GET(request, { params }) {
    const { businessId } = await params;
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[Meta][Webhook] Verification request for business:', businessId);

    if (mode === 'subscribe' && token) {
        await dbConnect();
        const business = await Business.findById(businessId);
        
        if (!business) {
            return new Response('Business not found', { status: 404 });
        }

        const metaCreds = await resolveMetaAdsCredentials(business);
        const storedWAToken = business.integrationCredentials?.whatsapp?.verifyToken;

        const { decrypt } = await import('@/lib/encryption');
        const resolveToken = (t) => {
            if (t && t.includes(':')) {
                try { return decrypt(t); } catch (e) { return t; }
            }
            return t;
        };

        const resolvedWA = resolveToken(storedWAToken);
        const resolvedAds = metaCreds.verifyToken;

        if (resolvedWA === token || resolvedAds === token) {
            const isAds = resolvedAds === token;
            const path = isAds ? 'integrationCredentials.facebookAds.enabled' : 'integrationCredentials.whatsapp.enabled';
            if (!business.get(path)) {
                business.set(path, true);
                business.markModified('integrationCredentials');
                await business.save();
            }

            return new Response(challenge, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        console.warn('[Meta][Webhook] Token mismatch. WA:', resolvedWA, '| Ads:', resolvedAds, '| Got:', token);
    }

    return new Response('Verification failed', { status: 403 });
}

/**
 * POST - Handle Incoming Webhook Events (Lead Ads + WhatsApp)
 */
export async function POST(request, { params }) {
    const { businessId } = await params;
    const receivedAt = new Date().toISOString();
    const routeLabel = `businessId:${businessId}`;

    logStep(1, `POST request received — route=${routeLabel}, at=${receivedAt}`);

    let rawBody = '';
    let payload = null;
    let ingressId = null;

    try {
        logStep(2, 'Request URL', request.url);
        logStep(2, 'Request headers', logHeaders(request.headers));

        rawBody = await request.text();
        logStep(3, 'Raw request body', rawBody);

        try {
            payload = JSON.parse(rawBody);
        } catch (parseError) {
            logStep(3, 'JSON parse FAILED', parseError.message);
            metaError('Webhook Step 3', 'JSON parse stack', parseError);
            return respond200({ success: false, error: 'Invalid JSON body', step: 'parse' }, '3-error');
        }

        await dbConnect();

        const ingressDoc = await recordMetaWebhookIngress({
            route: routeLabel,
            request,
            businessId,
            rawBody,
            payload
        });
        ingressId = ingressDoc._id;

        const parsedFields = parseLeadgenFields(payload);
        logStep(5, 'Payload object', parsedFields.object);
        logStep(5, 'Payload entry', parsedFields.entry);
        logStep(6, 'Payload changes', parsedFields.changes);
        logStep(7, 'leadgen_id', parsedFields.leadgen_id);
        logStep(8, 'page_id', parsedFields.page_id);
        logStep(9, 'form_id', parsedFields.form_id);

        if (!parsedFields.leadgenFound) {
            logStep(6, 'No leadgen field in payload — full payload logged above');
        }

        const business = await Business.findById(businessId);

        if (!business) {
            logStep(1, `Business not found: ${businessId}`);
            await finalizeMetaWebhookIngress(ingressId, {
                outcome: 'failed',
                processing: { step: 'business_not_found', error: `Business not found: ${businessId}` }
            });
            return respond200({ success: false, error: 'Business not found', businessId }, '1-error');
        }

        const signature = request.headers.get('x-hub-signature-256');
        const metaCreds = await resolveMetaAdsCredentials(business);
        const secretCandidates = await collectMetaAppSecretCandidates(metaCreds, business);
        const signatureResult = verifyMetaWebhookSignature(rawBody, signature, secretCandidates);

        logStep(4, 'Signature verification', {
            received: signatureResult.received,
            expected: signatureResult.expected,
            verified: signatureResult.valid,
            matchedSource: signatureResult.matchedSource,
            reason: signatureResult.reason,
            candidates: signatureResult.candidates
        });

        // Fail closed. This used to reject only a *wrong* signature, so a request
        // with no X-Hub-Signature-256 header (or a business with no secret
        // configured) was processed as if genuine — anyone who knew this URL
        // could inject WhatsApp messages, delivery receipts or template
        // approvals. Every delivery must now match a configured secret.
        if (signatureResult.valid !== true) {
            const reason = !signature
                ? 'Missing X-Hub-Signature-256 header'
                : signatureResult.reason === 'no_app_secret_candidates'
                    ? 'No app secret configured for this business'
                    : 'Invalid signature';
            await finalizeMetaWebhookIngress(ingressId, {
                outcome: 'rejected',
                processing: {
                    step: 'signature_invalid',
                    error: `${reason} — webhook rejected before processing`,
                    result: signatureResult
                },
                signature: {
                    received: signatureResult.received,
                    expected: signatureResult.expected,
                    verified: false,
                    secretSource: signatureResult.matchedSource,
                    candidates: signatureResult.candidates
                }
            });
            // Never echo signature diagnostics to the caller: they contain the
            // *expected* HMAC for this body (a forger could resend with it) and
            // secret previews. They stay in MetaWebhookIngress for debugging.
            return respond200({
                success: false,
                error: 'Invalid signature',
                step: 'signature'
            }, '4-error');
        }

        const allChanges = (payload.entry || []).flatMap((entry, entryIndex) =>
            (entry.changes || []).map((change, changeIndex) => ({
                entryIndex,
                changeIndex,
                entryId: entry.id,
                field: change.field,
                value: change.value
            }))
        );
        logStep(6, 'Parsed changes (all entries)', allChanges.length ? allChanges : payload.sample ?? 'none');

        const leadgenMatch = findLeadgenChange(payload);

        if (leadgenMatch) {
            const { change: leadgenChange, source } = leadgenMatch;
            const value = leadgenChange.value || {};

            logStep(9, 'Configured credentials', {
                credSource: metaCreds.source,
                configuredPageId: metaCreds.pageId,
                tokenPresent: Boolean(metaCreds.accessToken),
                appSecretPresent: Boolean(metaCreds.appSecret)
            });

            const result = await processMetaLeadgenWebhook(business, value, { source: `webhook:${source}` });

            logStep(14, 'Leadgen processing result', result);

            await finalizeMetaWebhookIngress(ingressId, {
                outcome: result.success ? 'success' : 'failed',
                processing: { step: result.step || 'leadgen_complete', result }
            });

            return respond200({
                success: result.success,
                status: result.status,
                leadId: result.leadId,
                reason: result.reason ?? null,
                error: result.error ?? null,
                tokenExpired: result.tokenExpired ?? false
            }, result.success ? '15-done' : '15-error');
        }

        logStep(6, 'No leadgen change found — checking WhatsApp');

        // Template approval / rejection updates
        const hasTemplateStatusEvent = (payload.entry || []).some((e) =>
          (e.changes || []).some(
            (c) => c.field === 'message_template_status_update' || c.field === 'template_category_update'
          )
        );
        if (hasTemplateStatusEvent) {
          const { processTemplateStatusPayload } = await import('@/lib/whatsapp/templateStatusWebhook');
          const templateResult = await processTemplateStatusPayload(payload);
          logStep(14, 'Template status processing result', templateResult);
          await finalizeMetaWebhookIngress(ingressId, {
            outcome: templateResult.updated > 0 ? 'success' : 'noop',
            processing: { step: 'template_status_processed', result: templateResult },
          });
          return respond200({
            success: true,
            channel: 'whatsapp',
            status: 'template_status_processed',
            ...templateResult,
          }, '15-template-status');
        }

        // Delivery / read / failed status updates (field=messages, value.statuses)
        const statusValue = (payload.entry || [])
          .flatMap((entry) => entry.changes || [])
          .find((change) => change.field === 'messages' && change.value?.statuses)?.value;

        if (statusValue?.statuses?.length) {
            const { processWhatsAppStatuses } = await import('@/lib/omnichannel/messageStatus');
            const statusResults = await processWhatsAppStatuses(business._id, statusValue.statuses);
            logStep(14, 'WhatsApp status processing result', statusResults);
            await finalizeMetaWebhookIngress(ingressId, {
                outcome: 'success',
                processing: { step: 'whatsapp_status_processed', count: statusResults.length, result: statusResults },
            });
            return respond200({
                success: true,
                channel: 'whatsapp',
                status: 'status_processed',
                processed: statusResults.length,
            }, '15-whatsapp-status');
        }

        const { extractWhatsAppPayload } = await import('@/lib/whatsapp/attribution');
        const data = extractWhatsAppPayload(payload);
        
        if (!data) {
            logStep(6, 'No actionable event in payload');
            await finalizeMetaWebhookIngress(ingressId, {
                outcome: 'noop',
                processing: { step: 'no_actionable_event', result: { object: payload.object } }
            });
            return respond200({ success: true, message: 'No actionable event', object: payload.object }, '6-noop');
        }

        const waResult = await leadManager.processIncomingMessage(businessId, {
            messageId: data.messageId,
            senderId: data.fromPhone,
            senderName: data.fromName,
            body: data.text,
            type: data.type || 'text',
            buttonId: data.buttonId,
            listId: data.listId,
            timestamp: data.timestamp,
            referral: data.referral,
            raw: data.rawMessage
        });

        logStep(14, 'WhatsApp processing result', waResult);
        await finalizeMetaWebhookIngress(ingressId, {
            outcome: 'success',
            processing: { step: 'whatsapp_message_processed', result: waResult },
        });
        return respond200({ success: true, channel: 'whatsapp', status: waResult.status }, '15-whatsapp');

    } catch (error) {
        logStep(15, 'Uncaught exception', error.message);
        metaError('Webhook Step 15', 'Uncaught exception', error);
        metaLog('Webhook Step 15', `Context — businessId=${businessId}, rawBodyLength=${rawBody?.length ?? 0}`);
        if (ingressId) {
            await finalizeMetaWebhookIngress(ingressId, {
                outcome: 'failed',
                processing: { step: 'uncaught_exception', error: error.message }
            });
        }
        return respond200({
            success: false,
            error: error.message,
            step: 'uncaught_exception'
        }, '15-error');
    }
}
