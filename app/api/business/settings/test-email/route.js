import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { verifyBusinessSMTP, sendBusinessEmail } from '@/lib/businessMailer';
import { encrypt } from '@/lib/encryption';
import { formatInTimeZone } from '@/lib/dates/localDateTime';

/**
 * POST /api/business/settings/test-email
 * Tests and verifies Hostinger SMTP connection for a business
 * Sends a test email using the business's own credentials
 */
export const POST = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const user = req.user;
    const { emailSettings, testRecipient } = await req.json();

    if (!emailSettings.username || !emailSettings.password) {
      return NextResponse.json({
        success: false,
        error: 'Email and Password are required for validation.'
      }, { status: 400 });
    }

    // Hardening: Check for copy-paste errors (trailing spaces)
    const username = emailSettings.username.trim();
    const password = emailSettings.password;
    const hasSpaces = password.startsWith(' ') || password.endsWith(' ');

    if (hasSpaces) {
      return NextResponse.json({
        success: false,
        error: 'CREDENTIALS ERROR: Your password has invisible spaces at the ends. Please re-type it manually.'
      }, { status: 400 });
    }

    const business = await Business.findById(user.businessId);
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 });
    }

    console.log(`[TestEmail] Testing SMTP for business: ${business.businessName}`);
    console.log(`[TestEmail] Email: ${username}`);

    // Encrypt password before saving
    const encryptedPassword = encrypt(password);

    // Force Hostinger host
    const host = (emailSettings.host && !emailSettings.host.includes('titan'))
      ? emailSettings.host
      : 'smtp.hostinger.com';

    // Update business with email credentials (temporarily for testing)
    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.email = {
      enabled: true,
      provider: 'smtp',
      host: host,
      port: emailSettings.port || 465,
      username: username,
      password: encryptedPassword,
      fromEmail: emailSettings.fromEmail || username,
      fromName: emailSettings.fromName || business.businessName,
      lastVerified: new Date()
    };

    console.log(`[TestEmail] Step 1: Verifying SMTP connection...`);

    // Verify SMTP connection
    const verifyResult = await verifyBusinessSMTP(business);

    if (!verifyResult.success) {
      console.error(`[TestEmail] SMTP verification failed:`, verifyResult.error);

      let errorMsg = verifyResult.error;
      if (verifyResult.code === 'EAUTH') {
        errorMsg = 'AUTHENTICATION FAILED: The server rejected your login. If you are using an ALIAS, ensure the "Primary Mailbox (Login)" field contains your main account email, not the alias.';
      } else if (verifyResult.code === 'ETIMEDOUT' || verifyResult.code === 'ECONNECTION') {
        errorMsg = 'CONNECTION TIMEOUT: Unable to reach Hostinger SMTP server. Please check your internet connection.';
      }

      return NextResponse.json({
        success: false,
        error: `Hostinger Validation Failed: ${errorMsg}`
      }, { status: 401 });
    }

    console.log(`[TestEmail] ✅ SMTP verification successful`);
    console.log(`[TestEmail] Step 2: Sending test email to ${testRecipient || username}...`);

    // Send test email using business's own credentials
    const emailResult = await sendBusinessEmail(business, {
      to: testRecipient || username,
      subject: '🚀 Hostinger SMTP Connection Verified!',
      html: `
        <div style="font-family: sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; max-width: 600px; margin: auto;">
          <div style="color: #4f46e5; font-size: 24px; font-weight: bold; margin-bottom: 16px;">✅ It's Working!</div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">We've successfully verified your <b>Hostinger</b> email credentials via SMTP.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">✉️ Verified Account: <b>${username}</b></p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">🔧 SMTP Host: <b>${emailSettings.host || 'smtp.hostinger.com'}</b></p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">📡 Status: <b>Active (Nodemailer)</b></p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Your lead communications will now be sent from your own business email address.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Verified at: ${formatInTimeZone(new Date())}</p>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Powered by <strong>LeadForGrow</strong></p>
        </div>
      `,
      text: `✅ Hostinger SMTP Connection Verified!\n\nYour email credentials have been successfully verified.\n\nVerified Account: ${username}\nSMTP Host: ${emailSettings.host || 'smtp.hostinger.com'}\nStatus: Active\n\nVerified at: ${formatInTimeZone(new Date())}`
    });

    if (emailResult.success) {
      console.log(`[TestEmail] ✅ Test email sent successfully (Message ID: ${emailResult.messageId})`);

      // Update integration health
      business.integrationHealth = business.integrationHealth || {};
      business.integrationHealth.email = {
        status: 'healthy',
        lastSuccessAt: new Date(),
        lastError: null
      };

      await business.save();

      return NextResponse.json({
        success: true,
        message: 'Hostinger verified & test email sent successfully!',
        messageId: emailResult.messageId
      });
    } else {
      console.error(`[TestEmail] Test email failed:`, emailResult.error);

      // Update integration health
      business.integrationHealth = business.integrationHealth || {};
      business.integrationHealth.email = {
        status: 'failing',
        lastSuccessAt: business.integrationHealth.email?.lastSuccessAt,
        lastError: emailResult.error
      };

      await business.save();

      return NextResponse.json({
        success: false,
        error: `SMTP verified, but email send failed: ${emailResult.error}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[TestEmail Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during validation: ' + error.message
    }, { status: 500 });
  }
});
