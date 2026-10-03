import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { leadManager } from '@/lib/automation/leadManager';
import { extractToken, verifyToken } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * Direct test lead injection — bypasses Meta entirely.
 * Requires an authenticated user of the target business.
 * GET: /api/webhooks/meta/inject-test-lead?businessId=<own business id>
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
        return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const token = extractToken(request);
    const user = token ? verifyToken(token) : null;
    if (!user?.businessId || String(user.businessId) !== String(businessId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Inject Test Lead] Starting for business: ${businessId}`);

    try {
        await dbConnect();
        console.log(`[Inject Test Lead] DB connected`);

        const result = await leadManager.processMetaLead(businessId, {
            metaLeadId: `direct_test_${Date.now()}`,
            name: 'Meta Ads Test Lead',
            email: 'testlead@meta.com',
            phone: '919876543210',
            campaignName: 'Direct Test Campaign',
            adSetName: 'Direct Test Ad Set',
            adName: 'Direct Test Ad',
            formId: 'direct_test_form',
            receivedAt: new Date(),
            fields: { source: 'direct_inject', is_test: true }
        });

        console.log(`[Inject Test Lead] Result:`, result);
        return NextResponse.json({ 
            success: true, 
            result,
            message: 'Check your CRM leads now!'
        });

    } catch (error) {
        console.error('[Inject Test Lead] ERROR:', error.message);
        console.error('[Inject Test Lead] Stack:', error.stack);
        return NextResponse.json({ 
            success: false, 
            error: serverErrorMessage(error) 
        }, { status: 500 });
    }
}
