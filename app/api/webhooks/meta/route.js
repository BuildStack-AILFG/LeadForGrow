import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { verifyMetaSignature } from '@/lib/webhookSecurity';
import { decryptMaybe } from '@/lib/encryption';
import { parseMetaWebhook } from '@/lib/whatsapp/parser';
import { leadManager } from '@/lib/automation/leadManager';
import { processLeadgenPayload, findBusinessByMetaPageId } from '@/lib/meta/leadgenHandler';
import { resolveMetaAdsCredentials } from '@/lib/meta/credentials';
import { metaLog } from '@/lib/meta/logger';
import {
  recordMetaWebhookIngress,
  finalizeMetaWebhookIngress,
  collectMetaAppSecretCandidates,
  verifyMetaWebhookSignature,
  verifyMetaSignatureForBusinesses,
  parseLeadgenFields
} from '@/lib/meta/webhookIngress';

/**
 * Record a signature failure on the ingress row and answer 200 so Meta does
 * not retry a forged or misconfigured delivery forever. The raw body stays in
 * MetaWebhookIngress (30-day TTL), so a genuine event rejected because a
 * secret was missing can be replayed once the secret is configured.
 */
async function rejectUnsigned(ingressId, step, result) {
  metaLog('Webhook Generic', `Signature rejected at ${step}`, { reason: result?.reason, matchedSource: result?.matchedSource });
  await finalizeMetaWebhookIngress(ingressId, {
    outcome: 'rejected',
    processing: { step, error: result?.reason || 'invalid_signature' },
    signature: {
      received: result?.received,
      expected: result?.expected,
      verified: false,
      candidates: result?.candidates,
    },
  });
  return NextResponse.json({ status: 'unauthorized', step }, { status: 200 });
}

/**
 * Generic Meta webhook — /api/webhooks/meta
 * Meta App callback URL often points here (single URL per app).
 * Lead Ads: resolves business by page_id from payload.
 */

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  metaLog('Webhook Generic', `GET verification — mode=${mode}, url=${req.url}`);

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    metaLog('Webhook Generic', 'Verification successful (META_VERIFY_TOKEN)');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  const startTime = Date.now();
  const routeLabel = 'generic:/api/webhooks/meta';
  let ingressId = null;
  let ingressDoc = null;
  let rawBody = '';

  try {
    rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const payload = JSON.parse(rawBody);

    metaLog('Webhook Generic', `POST received — url=${req.url}`, {
      object: payload.object,
      entryCount: payload.entry?.length ?? 0
    });

    await dbConnect();

    ingressDoc = await recordMetaWebhookIngress({
      route: routeLabel,
      request: req,
      rawBody,
      payload
    });
    ingressId = ingressDoc._id;

    // Facebook Page — Messenger DMs (entry.messaging[]) and post comments
    // (entry.changes[] field==='feed', item==='comment'). Meta bundles these under
    // object==='page'; genuine lead-ads 'page' events have field==='leadgen' and
    // fall through to the leadgen handler below.
    if (payload.object === 'page') {
      const entries = payload.entry || [];
      const hasMessaging = entries.some((e) => Array.isArray(e.messaging) && e.messaging.length);
      const hasFeedComment = entries.some((e) =>
        (e.changes || []).some((c) => c.field === 'feed' && c.value?.item === 'comment')
      );

      if (hasMessaging || hasFeedComment) {
        const {
          parseMessengerEvents,
          processMessengerEvent,
          parseFacebookComments,
          processFacebookCommentEvent,
        } = await import('@/lib/facebook/handler');

        let totalProcessed = 0;

        // Resolve every entry's business first, then verify the signature once
        // against all of them BEFORE touching any data. Unsigned Messenger or
        // comment events could otherwise create fake leads and fire comment
        // auto-DMs from the business's own Page.
        const matched = [];
        for (const entry of entries) {
          const pageId = entry?.id;
          const business = await Business.findOne({
            $or: [
              { 'integrationCredentials.facebook.pageId': pageId },
              { 'integrationCredentials.facebookAds.pageId': pageId },
            ],
          });
          if (business) matched.push({ entry, business });
        }

        if (matched.length) {
          const sig = await verifyMetaSignatureForBusinesses(rawBody, signature, matched.map((m) => m.business));
          if (!sig.valid) return rejectUnsigned(ingressId, 'facebook_signature_invalid', sig);

          for (const { entry, business } of matched) {
            for (const event of parseMessengerEvents(entry)) {
              await processMessengerEvent(business._id, event);
              totalProcessed += 1;
            }
            for (const event of parseFacebookComments(entry)) {
              await processFacebookCommentEvent(business._id, event);
              totalProcessed += 1;
            }
          }
        }

        if (matched.length) {
          await finalizeMetaWebhookIngress(ingressId, {
            outcome: 'success',
            processing: { step: 'facebook_processed', count: totalProcessed },
          });
          return NextResponse.json({ status: 'success', processed: totalProcessed }, { status: 200 });
        }
        // No business matched this page's messaging/comments — fall through to
        // leadgen, which resolves the business differently (by page_id in value).
      }
    }

    const parsedFields = parseLeadgenFields(payload);
    metaLog('Webhook Generic', 'Parsed leadgen fields', parsedFields);

    const isLeadgen =
      parsedFields.leadgenFound ||
      payload.object === 'page' ||
      payload.entry?.some((e) => e.changes?.some((c) => c.field === 'leadgen'));

    if (isLeadgen) {
      metaLog('Webhook Generic', 'Leadgen payload detected — resolving business by page_id');

      let business = null;
      let metaCreds = null;
      if (parsedFields.page_id) {
        const match = await findBusinessByMetaPageId(parsedFields.page_id);
        business = match?.business ?? null;
        if (business) {
          metaCreds = await resolveMetaAdsCredentials(business);
          await finalizeMetaWebhookIngress(ingressId, {
            outcome: 'received',
            processing: { step: 'business_resolved', result: { businessId: business._id.toString() } }
          });
          ingressDoc.businessId = business._id;
          await ingressDoc.save();
        }
      }

      if (business) {
        const candidates = await collectMetaAppSecretCandidates(metaCreds, business);
        const signatureResult = signature
          ? verifyMetaWebhookSignature(rawBody, signature, candidates)
          : { valid: false, received: null, expected: null, candidates: candidates?.length ?? 0 };
        metaLog('Webhook Generic', 'Leadgen signature verification', signatureResult);

        if (signatureResult.valid !== true) {
          const reason = !signature
            ? 'Missing signature'
            : signatureResult.reason === 'no_app_secret_candidates'
              ? 'No app secret configured for this business'
              : 'Invalid signature';
          await finalizeMetaWebhookIngress(ingressId, {
            outcome: 'rejected',
            processing: { step: 'signature_invalid', error: reason, result: signatureResult },
            signature: {
              received: signatureResult.received,
              expected: signatureResult.expected,
              verified: false,
              candidates: signatureResult.candidates
            }
          });
          // No signature diagnostics in the response: they include the expected
          // HMAC for this body, which would let a forger resend it signed.
          return NextResponse.json(
            { success: false, error: reason, step: 'signature' },
            { status: 200 }
          );
        }
      }

      const leadgenResult = await processLeadgenPayload(payload);

      if (leadgenResult) {
        const duration = Date.now() - startTime;
        metaLog('Webhook Generic', `Leadgen handled in ${duration}ms`, leadgenResult);

        await finalizeMetaWebhookIngress(ingressId, {
          outcome: leadgenResult.success ? 'success' : 'failed',
          processing: { step: leadgenResult.step || 'leadgen_complete', result: leadgenResult }
        });

        return NextResponse.json(leadgenResult, { status: 200 });
      }

      if (payload.object === 'page') {
        await finalizeMetaWebhookIngress(ingressId, {
          outcome: 'failed',
          processing: {
            step: 'leadgen_extract_failed',
            error: 'Page object received but leadgen_id could not be extracted — see raw body in MetaWebhookIngress'
          }
        });
        return NextResponse.json(
          { success: false, error: 'Page webhook received but no leadgen change found', parsedFields },
          { status: 200 }
        );
      }
    }

    // Instagram — DMs (entry.messaging[]) and comments (entry.changes[] where field==='comments').
    // Meta bundles both under object==='instagram' and can send several entries in one POST.
    if (payload.object === 'instagram') {
      const {
        parseInstagramMessaging,
        processInstagramEvent,
        parseInstagramChanges,
        processInstagramCommentEvent,
      } = await import('@/lib/instagram/handler');

      let totalProcessed = 0;

      // Resolve businesses, verify once, then process — never the other way round.
      const matched = [];
      for (const entry of payload.entry || []) {
        const pageId = entry?.id;
        const business = await Business.findOne({
          $or: [
            { 'integrationCredentials.instagram.pageId': pageId },
            { 'integrationCredentials.facebookAds.pageId': pageId },
          ],
        });
        if (business) matched.push({ entry, business });
      }

      if (matched.length) {
        const sig = await verifyMetaSignatureForBusinesses(rawBody, signature, matched.map((m) => m.business));
        if (!sig.valid) return rejectUnsigned(ingressId, 'instagram_signature_invalid', sig);

        for (const { entry, business } of matched) {
          for (const event of parseInstagramMessaging(entry)) {
            await processInstagramEvent(business._id, event);
            totalProcessed += 1;
          }
          for (const event of parseInstagramChanges(entry)) {
            await processInstagramCommentEvent(business._id, event);
            totalProcessed += 1;
          }
        }
      }

      if (!matched.length) {
        await finalizeMetaWebhookIngress(ingressId, {
          outcome: 'failed',
          processing: { step: 'instagram_business_not_found' },
        });
        return NextResponse.json({ status: 'business_not_found' }, { status: 200 });
      }

      await finalizeMetaWebhookIngress(ingressId, {
        outcome: 'success',
        processing: { step: 'instagram_processed', count: totalProcessed },
      });
      return NextResponse.json({ status: 'success', processed: totalProcessed }, { status: 200 });
    }

    // WhatsApp template status updates (auto-sync APPROVED/REJECTED/etc.)
    const hasTemplateStatusEvent = (payload.entry || []).some((e) =>
      (e.changes || []).some(
        (c) => c.field === 'message_template_status_update' || c.field === 'template_category_update'
      )
    );
    if (hasTemplateStatusEvent) {
      // entry.id is the WhatsApp Business Account id. An unsigned request here
      // could flip any template to APPROVED/REJECTED, so verify first.
      const wabaIds = (payload.entry || []).map((e) => String(e?.id || '')).filter(Boolean);
      const wabaBusinesses = wabaIds.length
        ? await Business.find({ 'integrationCredentials.whatsapp.businessAccountId': { $in: wabaIds } })
        : [];
      const sig = await verifyMetaSignatureForBusinesses(rawBody, signature, wabaBusinesses);
      if (!sig.valid) return rejectUnsigned(ingressId, 'template_status_signature_invalid', sig);

      const { processTemplateStatusPayload } = await import('@/lib/whatsapp/templateStatusWebhook');
      const templateResult = await processTemplateStatusPayload(payload);
      await finalizeMetaWebhookIngress(ingressId, {
        outcome: templateResult.updated > 0 ? 'success' : 'noop',
        processing: { step: 'template_status_processed', result: templateResult },
      });
      return NextResponse.json({ status: 'success', ...templateResult }, { status: 200 });
    }

    // WhatsApp messages
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    if (value?.statuses) {
      const phoneNumberId = value.metadata?.phone_number_id;
      const business = phoneNumberId
        ? await Business.findOne({ 'integrationCredentials.whatsapp.phoneNumberId': phoneNumberId })
        : null;
      if (business) {
        // Delivery/read/failed receipts feed broadcast analytics; forged ones
        // would falsify them, so they need a valid signature like messages do.
        const sig = await verifyMetaSignatureForBusinesses(rawBody, signature, [business]);
        if (!sig.valid) return rejectUnsigned(ingressId, 'whatsapp_status_signature_invalid', sig);

        const { processWhatsAppStatuses } = await import('@/lib/omnichannel/messageStatus');
        const statusResults = await processWhatsAppStatuses(business._id, value.statuses);
        await finalizeMetaWebhookIngress(ingressId, {
          outcome: 'success',
          processing: { step: 'whatsapp_status_processed', count: statusResults.length },
        });
        return NextResponse.json({ status: 'success', processed: statusResults.length }, { status: 200 });
      }
      await finalizeMetaWebhookIngress(ingressId, { outcome: 'noop', processing: { step: 'whatsapp_status_no_business' } });
      return NextResponse.json({ status: 'business_not_found' }, { status: 200 });
    }

    const parsedData = parseMetaWebhook(payload);
    if (!parsedData) {
      await finalizeMetaWebhookIngress(ingressId, {
        outcome: 'noop',
        processing: { step: 'invalid_payload', error: 'Not leadgen or WhatsApp message' }
      });
      return NextResponse.json({ status: 'invalid_payload', object: payload.object }, { status: 200 });
    }

    const business = await Business.findOne({
      'integrationCredentials.whatsapp.phoneNumberId': parsedData.phoneNumberId
    }).select('+integrationCredentials.whatsapp.appSecret');

    if (!business) {
      metaLog('Webhook Generic', `Business not found for PhoneID: ${parsedData.phoneNumberId}`);
      await finalizeMetaWebhookIngress(ingressId, {
        outcome: 'failed',
        processing: { step: 'whatsapp_business_not_found' }
      });
      return NextResponse.json({ status: 'business_not_found' }, { status: 200 });
    }

    const isValid = verifyMetaSignature(
      rawBody,
      signature,
      decryptMaybe(business.integrationCredentials.whatsapp.appSecret) || process.env.META_APP_SECRET
    );

    if (!isValid) {
      metaLog('Webhook Generic', `Invalid WhatsApp signature for business ${business._id}`);
      await finalizeMetaWebhookIngress(ingressId, {
        outcome: 'rejected',
        processing: { step: 'whatsapp_signature_invalid' }
      });
      return NextResponse.json({ status: 'unauthorized' }, { status: 200 });
    }

    await leadManager.processIncomingMessage(business._id, parsedData);

    await finalizeMetaWebhookIngress(ingressId, {
      outcome: 'success',
      processing: { step: 'whatsapp_message_processed' }
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    metaLog('Webhook Generic', 'Error', error.message);
    if (ingressId) {
      await finalizeMetaWebhookIngress(ingressId, {
        outcome: 'failed',
        processing: { step: 'uncaught_exception', error: error.message }
      });
    }
    return NextResponse.json({ status: 'error', message: error.message }, { status: 200 });
  }
}
