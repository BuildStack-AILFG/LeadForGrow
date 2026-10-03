import { NextResponse } from 'next/server';
import Business from '@/models/Business';
import { callTelephonyProvider } from '@/lib/call-automation/providers/call_telephony.provider';
import { withAuth } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
    try {
        let { userId, businessId: bodyBusinessId, leadId, leadPhone } = await req.json();
        const user = req.user;
        const businessId = bodyBusinessId || user.businessId;

        if (!businessId || !leadId || !leadPhone) {
            return NextResponse.json({ success: false, error: 'Missing required parameters (businessId/leadId/leadPhone)' }, { status: 400 });
        }

        // Normalize Phone to E.164 if it's missing the + prefix
        let normalizedPhone = leadPhone.replace(/\s+/g, '');
        if (!normalizedPhone.startsWith('+')) {
            // Check if it's just numbers (like 91...)
            if (/^\d+$/.test(normalizedPhone)) {
                normalizedPhone = '+' + normalizedPhone;
            }
        }

        const business = await Business.findById(businessId).select('+settings.callAutomation.telephony.apiKey +settings.callAutomation.telephony.apiSecret');

        if (!business) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const telephonyConfig = business.settings?.callAutomation?.telephony;

        if (!telephonyConfig || !telephonyConfig.provider) {
            return NextResponse.json({ success: false, error: 'Telephony not configured' }, { status: 400 });
        }

        // Logic to generate token/session based on provider
        let sessionData = {};

        if (telephonyConfig.provider === 'vapi') {
            sessionData = {
                provider: 'vapi',
                leadId: leadId,
                apiKey: telephonyConfig.apiKey,
                assistantId: telephonyConfig.assistantId,
                config: {
                    recipientPhoneNumber: normalizedPhone,
                    recordingEnabled: true
                }
            };
        } else if (telephonyConfig.provider === 'twilio') {
            const token = await callTelephonyProvider.generateTwilioAccessToken(businessId);
            sessionData = {
                provider: 'twilio',
                leadId: leadId,
                token: token,
                leadPhone: normalizedPhone
            };
        }

        return NextResponse.json({
            success: true,
            data: sessionData
        });

    } catch (error) {
        console.error('[API Initiate Call] Error:', error);
        return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
    }
});
