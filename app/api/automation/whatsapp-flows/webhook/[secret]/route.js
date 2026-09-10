import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import { startFlowExecution } from '@/lib/whatsappFlows/engine';

/**
 * Public webhook trigger for a published flow.
 * POST /api/automation/whatsapp-flows/webhook/[secret]
 */
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { secret } = await params;
    const flow = await WhatsAppFlow.findOne({ webhookSecret: secret, status: 'published' });
    if (!flow) return NextResponse.json({ success: false, error: 'Invalid webhook' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const business = await Business.findById(flow.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    let lead = null;
    if (body.leadId) {
      lead = await Lead.findOne({ _id: body.leadId, businessId: flow.businessId });
    } else if (body.phone) {
      const digits = String(body.phone).replace(/\D/g, '');
      lead = await Lead.findOne({
        businessId: flow.businessId,
        $or: [{ phone: digits }, { whatsapp: digits }, { phone: body.phone }, { whatsapp: body.phone }],
      });
      if (!lead) {
        lead = await Lead.create({
          businessId: flow.businessId,
          name: body.name || 'Webhook Lead',
          phone: digits || body.phone,
          whatsapp: digits || body.phone,
          source: 'whatsapp_flow_webhook',
        });

        // Real-time: notify the workspace (sound + toast) of the new lead.
        try {
          const { emitLeadUpdated } = await import('@/lib/realtime/publish');
          emitLeadUpdated(flow.businessId, { leadId: lead._id, action: 'created', source: 'whatsapp_flow_webhook' }).catch(() => {});
        } catch (err) {
          console.warn('[whatsapp-flows webhook] emitLeadUpdated failed:', err.message);
        }
      }
    }

    if (!lead) {
      return NextResponse.json({ success: false, error: 'leadId or phone required' }, { status: 400 });
    }

    const execution = await startFlowExecution({
      flow,
      business,
      lead,
      triggerPayload: { text: body.message || '', variables: body.variables || {} },
    });

    return NextResponse.json({
      success: true,
      executionId: execution?._id,
      status: execution?.status,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  const { secret } = await params;
  await dbConnect();
  const flow = await WhatsAppFlow.findOne({ webhookSecret: secret }).select('name status').lean();
  if (!flow) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, flow: flow.name, status: flow.status, challenge: crypto.randomBytes(4).toString('hex') });
}
