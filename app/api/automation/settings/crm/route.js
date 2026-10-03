import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getCrmSettings, mergeCrmSettingsPayload, PAYMENT_ON_CONFIRM_MODES, LOST_REASONS } from '@/lib/crm/crmSettings';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId).lean();
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    const creds = business.integrationCredentials || {};
    return NextResponse.json({
      success: true,
      data: {
        ...getCrmSettings(business),
        lostReasons: LOST_REASONS,
        paymentModes: PAYMENT_ON_CONFIRM_MODES,
        integrations: {
          whatsapp: !!creds.whatsapp?.enabled,
          email: !!creds.email?.enabled,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    const payload = mergeCrmSettingsPayload(body);
    business.settings = business.settings || {};
    business.settings.crm = { ...(business.settings.crm || {}), ...payload };
    business.markModified('settings.crm');
    await business.save();

    const creds = business.integrationCredentials || {};
    return NextResponse.json({
      success: true,
      data: {
        ...getCrmSettings(business),
        integrations: {
          whatsapp: !!creds.whatsapp?.enabled,
          email: !!creds.email?.enabled,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
