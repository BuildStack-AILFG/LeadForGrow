import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Lead from '@/models/automation/Lead';
import Integration from '@/models/Integration';
import Message from '@/models/automation/Message';
import Activity from '@/models/automation/Activity';
import { decryptCredentials } from '@/lib/integrations/credentials';

import { verifyInteraktToken } from '@/lib/webhookSecurity';

/**
 * GET /api/integrations/webhooks/interakt-reply
 * Validation endpoint for manual check
 */
export async function GET() {
    return NextResponse.json({ success: false, error: 'Method Not Allowed' }, { status: 405 });
}

/**
 * POST /api/integrations/webhooks/interakt-reply?businessId=...&token=...
 * Handles incoming WhatsApp replies from Interakt.
 *
 * The business comes from the URL (shown on the Integrations page) and the
 * token must match that business's Interakt "Webhook Secret" (or the platform
 * INTERAKT_WEBHOOK_TOKEN). No token configured means every request is refused,
 * and leads are only ever matched inside that one business.
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token') || request.headers.get('x-interakt-token');
        const businessId = searchParams.get('businessId');

        if (!businessId || !mongoose.isValidObjectId(businessId)) {
            return NextResponse.json({ success: false, error: 'Missing businessId — copy the webhook URL from Integrations again' }, { status: 400 });
        }

        await dbConnect();

        const integration = await Integration.findOne({ businessId, integrationId: 'interakt' }).lean();
        const creds = integration?.credentials ? decryptCredentials('interakt', integration.credentials) : {};

        if (!verifyInteraktToken(token, [creds.webhookSecret, process.env.INTERAKT_WEBHOOK_TOKEN])) {
            console.warn('[Webhook Interakt] Unauthorized access attempt: Invalid token');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const payload = await request.json();

        // 1. Data Extraction (Support both Interakt and flat test payload)
        let incomingPhone, incomingText, externalId;

        if (payload.data && payload.data.customer) {
            // Official Interakt Structure
            const { customer, message } = payload.data;
            incomingPhone = customer.phoneNumber;
            incomingText = message?.text || '';
            externalId = message?.id;
        } else {
            // Flat Manual Test Structure (as per Phase 1 request)
            incomingPhone = payload.phone;
            incomingText = payload.message || '';
            externalId = payload.messageId;
        }

        // In LFG, phone numbers are normalized without '+' or country code for lead lookup.
        // We strip non-digits, then remove leading '91' (India) or '0' (Local).
        const normalizedPhone = String(incomingPhone || '').replace(/\D/g, '').replace(/^(91|0)/, '');

        // Too short to identify one person (an empty pattern would match every lead).
        if (normalizedPhone.length < 6) {
            console.log('[Webhook Interakt] Invalid payload: Missing phone');
            return NextResponse.json({ success: false, error: 'Missing phone' }, { status: 400 });
        }

        const phonePattern = new RegExp(`${normalizedPhone}$`);
        const lead = await Lead.findOne({
            businessId,
            $or: [{ phone: phonePattern }, { whatsapp: phonePattern }],
            archived: false
        }).sort({ receivedAt: -1 });

        if (!lead) {
            console.log(`[Webhook Interakt] No matching lead found for ${incomingPhone}`);
            return NextResponse.json({ success: true, message: 'No matching lead' });
        }

        // 3. Idempotency Check
        if (externalId) {
            const existing = await Message.findOne({ businessId, externalMessageId: String(externalId) }).select('_id').lean();
            if (existing) {
                return NextResponse.json({ success: true, message: 'Duplicate ignored' });
            }
        }

        // 4. Persistence Flow (Close the Loop)
        const bizId = lead.businessId;

        // A. Save Incoming Message
        await Message.create({
            leadId: lead._id,
            businessId: bizId,
            direction: 'incoming',
            text: incomingText,
            externalMessageId: externalId ? String(externalId) : undefined,
            timestamp: new Date()
        });

        // B. Record Activity
        await Activity.create({
            leadId: lead._id,
            businessId: bizId,
            type: 'whatsapp_received',
            description: `WhatsApp reply received: "${incomingText.substring(0, 30)}..."`,
            performedBy: lead.assignedTo || lead.businessId, // Use lead owner or biz ID as fallback
            performedAt: new Date(),
            metadata: { externalId }
        });

        // C. Update Lead Pulse
        await Lead.findByIdAndUpdate(lead._id, {
            lastActivityAt: new Date(),
            status: lead.status === 'new' ? 'contacted' : lead.status // Auto-move to contacted if new
        });

        console.log(`[Webhook Interakt] Successfully processed reply for lead ${lead._id}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Webhook Interakt] Fatal Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal error'
        }, { status: 500 });
    }
}
