import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { verifyBusinessSMTP } from '@/lib/businessMailer';
import { decrypt } from '@/lib/encryption';
import { withPlanAccess } from '@/lib/accessControl';

/**
 * GET /api/debug/email-test
 * Checks the signed-in user's own business SMTP settings: config present,
 * password decrypts, and the server accepts the login.
 */
export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);

    if (!business) {
      return NextResponse.json({ status: 'Error', message: 'Business not found' }, { status: 404 });
    }

    const emailConfig = business.integrationCredentials?.email || {};

    const report = {
      id: business._id,
      name: business.businessName,
      config: {
        enabled: emailConfig.enabled,
        host: emailConfig.host,
        port: emailConfig.port,
        user: emailConfig.username,
        hasPassword: !!emailConfig.password,
        fromName: emailConfig.fromName,
        fromEmail: emailConfig.fromEmail
      }
    };

    try {
      const pass = decrypt(emailConfig.password);
      report.decryption = pass ? { success: true } : { success: false, error: 'Decrypted to null' };
    } catch (e) {
      report.decryption = { success: false, error: e.message };
    }

    try {
      const result = await verifyBusinessSMTP(business);
      report.smtpTest = result;

      if (result.success) {
        return NextResponse.json({ status: 'Healthy', report });
      }
      return NextResponse.json({ status: 'Unhealthy', error: result.error, report }, { status: 500 });
    } catch (error) {
      return NextResponse.json({ status: 'Crash', error: error.message, report }, { status: 500 });
    }
  } catch (error) {
    console.error('[debug/email-test]', error);
    return NextResponse.json({ status: 'Fatal', error: 'Email check failed' }, { status: 500 });
  }
});
