import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import WebhookLog from '@/models/automation/WebhookLog';
import { ingestLead } from '@/lib/leadProcessor';
import { dispatchAutomationEvent } from '@/lib/automation/triggerHub';
import { sequenceEngine } from '@/lib/sequences/engine';

function verifySignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sig = signature.replace(/^sha256=/, '');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return expected === sig;
  }
}

// Constant-time string compare (hashing first makes the lengths equal).
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const h = (v) => crypto.createHash('sha256').update(v).digest();
  return crypto.timingSafeEqual(h(a), h(b));
}

// Headers kept on the log row, minus anything that carries a credential.
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'x-api-key', 'x-webhook-signature', 'x-hub-signature-256', 'proxy-authorization']);
function loggableHeaders(headers) {
  return Object.fromEntries([...headers.entries()].filter(([k]) => !SENSITIVE_HEADERS.has(k.toLowerCase())));
}

export async function POST(request, { params }) {
  const { sequenceId, secret } = await params;
  const rawBody = await request.text();
  let body = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (!mongoose.isValidObjectId(sequenceId)) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }
    await dbConnect();
    const sequence = await AutomationSequence.findById(sequenceId).lean();
    if (!sequence || sequence.triggerType !== 'webhook') {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    const expectedSecret = sequence.webhookSecret || sequence.triggerConfig?.secret;
    const apiKey = request.headers.get('x-api-key');
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-hub-signature-256');

    const authed = safeEqual(secret, expectedSecret)
      || safeEqual(apiKey, expectedSecret)
      || (expectedSecret && verifySignature(rawBody, signature, expectedSecret));

    if (!authed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const log = await WebhookLog.create({
      businessId: sequence.businessId,
      webhookId: `wf_${sequenceId}_${Date.now()}`,
      payload: body,
      status: 'pending',
      metadata: { sequenceId, headers: loggableHeaders(request.headers) },
    });

    let lead;
    if (body.leadId) {
      const Lead = (await import('@/models/automation/Lead')).default;
      lead = await Lead.findById(body.leadId);
    } else {
      const result = await ingestLead(
        {
          name: body.name || body.full_name || 'Webhook Lead',
          email: body.email,
          phone: body.phone || body.mobile,
          source: 'webhook',
          sourceDetails: `workflow:${sequenceId}`,
          metadata: body,
        },
        sequence.businessId
      );
      lead = result.lead;
    }

    if (!lead) {
      await WebhookLog.updateOne({ _id: log._id }, { status: 'failed', error: 'No lead' });
      return NextResponse.json({ success: false, error: 'Could not resolve lead' }, { status: 422 });
    }

    await dispatchAutomationEvent(lead, 'webhook', body);
    await sequenceEngine.tryStartByTriggerType(lead, 'webhook');
    await sequenceEngine.startWorkflow(lead, sequenceId);

    await WebhookLog.updateOne({ _id: log._id }, { status: 'processed', leadId: lead._id });

    return NextResponse.json({
      success: true,
      leadId: lead._id,
      logId: log._id,
      replayable: true,
    });
  } catch (error) {
    console.error('[Webhook Trigger]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const { sequenceId } = await params;
  return NextResponse.json({
    success: true,
    message: 'LeadForGrow workflow webhook endpoint',
    sequenceId,
    method: 'POST',
    headers: ['x-api-key', 'x-webhook-signature'],
  });
}
