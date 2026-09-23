import { sendBusinessEmail } from '../businessMailer';
import { makeUnsubscribeToken } from '../unsubscribeToken';

/**
 * Build the public unsubscribe URL a recipient can click to opt out.
 * Uses NEXT_PUBLIC_APP_URL because emails are read outside our origin;
 * relative URLs won't work.
 */
export function buildUnsubscribeUrl(lead, business) {
  if (!lead?._id || !business?._id) return null;
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const token = makeUnsubscribeToken(String(lead._id), String(business._id));
  return `${base}/api/unsubscribe/${token}`;
}

/**
 * Email Integration - Multi-Tenant Hostinger + Nodemailer
 * Each business uses their OWN verified Hostinger email credentials
 * NO shared sender emails, NO test SMTP, Production-only logic
 */

/**
 * Renders a message template with lead data
 */
export const renderTemplate = (template, lead, business = {}) => {
  if (!template) return '';

  // Handle Mongoose Maps/Objects for metadata
  const metadata = lead.metadata instanceof Map ? Object.fromEntries(lead.metadata) : (lead.metadata || {});
  const emailConfig = business.integrationCredentials?.email || {};

  const placeholders = {
    // Simple keys (legacy/internal)
    name: lead.name || 'there',
    phone: lead.phone || '',
    email: lead.email || '',
    serviceInterest: lead.serviceInterest || 'our services',
    message: lead.message || '',
    businessName: business.businessName || metadata.businessName || 'LeadForGrow',

    // Explicit keys (UI matching)
    'lead.name': lead.name || 'there',
    'lead.email': lead.email || '',
    'lead.phone': lead.phone || '',
    'lead.serviceInterest': lead.serviceInterest || 'our services',
    'business.name': business.businessName || 'LeadForGrow',
    'user.name': emailConfig.fromName || business.businessName || 'Team' // Best effort fallback
  };

  return template.replace(/\{\{(.*?)\}\}/g, (match, field) => {
    const key = field.trim();
    return placeholders[key] !== undefined ? placeholders[key] : match;
  });
};

/**
 * Sends an automated lead acknowledgment using business's own Hostinger email
 * @param {Object} lead - The lead document
 * @param {Object} business - The business document with email credentials
 * @param {string} template - Email template with placeholders
 * @param {string} subject - Email subject line
 * @returns {Object} - { success: boolean, messageId?: string, error?: string }
 */

/**
 * Sends an automated lead acknowledgment using business's own Hostinger email
 * @param {Object} lead - The lead document
 * @param {Object} business - The business document with email credentials
 * @param {string} template - Email template with placeholders
 * @param {string} subject - Email subject line
 * @returns {Object} - { success: boolean, messageId?: string, error?: string }
 */
export const sendCustomerEmail = async (
  lead,
  business,
  template,
  subject = 'We received your interest!',
  options = {}
) => {
  const logPrefix = `[Email:${business.businessName}]`;
  // Provenance for the inbox filter. Callers pass 'automation' | 'sequence'
  // | 'broadcast'; default 'user' matches ad-hoc use.
  const { origin = 'automation', performedBy = null } = options;

  try {
    // Check if business has email integration enabled
    const emailConfig = business.integrationCredentials?.email;

    if (!emailConfig || !emailConfig.enabled) {
      console.log(`${logPrefix} [EMAIL][ERROR] Email integration not enabled for this business`);
      // We don't throw here because this is a configuration issue, not a sending failure for a configured business.
      // But user said "Fail HARD". If logic expects email to go, and it can't, it's a failure.
      return {
        success: false,
        error: 'Email integration not configured. Please set up your Hostinger email in Integrations.'
      };
    }

    // Render template
    const content = renderTemplate(template, lead, business);
    const renderedSubject = renderTemplate(subject, lead, business);

    // Build unsubscribe URL (returns null for ad-hoc / test recipients without a lead id)
    const unsubscribeUrl = buildUnsubscribeUrl(lead, business);
    const unsubscribeFooterHtml = unsubscribeUrl
      ? `<p class="unsubscribe">
           Don't want these emails?
           <a href="${unsubscribeUrl}" target="_blank" rel="noreferrer">Unsubscribe</a>
         </p>`
      : '';
    const unsubscribeFooterText = unsubscribeUrl
      ? `\n\n---\nUnsubscribe: ${unsubscribeUrl}`
      : '';

    // Prepare ultra-premium email HTML (re-using existing HTML logic)
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            body { margin: 0; padding: 0; origin:0; background-color: #ffffff; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
            .container { width: 100%; margin: 0; background: #ffffff; padding: 20px; }

            .content { width: 100%; text-align: left; }
            .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; text-align: left; }
            .main-text { color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: left; white-space: pre-wrap; }

            .footer { padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: left; }
            .footer p { margin: 4px 0; color: #64748b; font-size: 13px; font-weight: 500; }
            .branding { color: #94a3b8; font-size: 11px; margin-top: 12px; }
            .unsubscribe { color: #94a3b8; font-size: 11px; margin-top: 16px; }
            .unsubscribe a { color: #64748b; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="greeting">Hello ${lead.name.split(' ')[0]},</div>
              <div class="main-text">${content.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>Best regards,</p>
              <p><strong>${emailConfig.fromName || business.businessName}</strong></p>
              <p class="branding">Powered by LeadForGrow</p>
              ${unsubscribeFooterHtml}
            </div>
          </div>
        </body>
      </html>
    `;

    // IMPORTANT: Call sendBusinessEmail which now has RETRIES and STRICT AWAIT
    const result = await sendBusinessEmail(business, {
      to: lead.email,
      subject: renderedSubject,
      html: emailHTML,
      text: content + unsubscribeFooterText,
      headers: unsubscribeUrl
        ? {
            // Gmail-native one-click unsubscribe (RFC 8058)
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          }
        : undefined,
    });

    // If the SMTP send succeeded AND we have a lead-bound context, record
    // an outbound Message so the send appears in the Unified Inbox and any
    // customer reply can thread against it via In-Reply-To. Guarded so
    // ad-hoc / warming sends (no lead._id) don't pollute the inbox.
    if (result?.success && lead?._id && business?._id) {
      try {
        const { recordChannelMessage } = await import('@/lib/omnichannel/conversationService');
        await recordChannelMessage({
          businessId: business._id,
          channel: 'email',
          leadId: lead._id,
          // Real RFC Message-ID Nodemailer returned. Enables reply threading
          // when the customer responds and IMAP sync pulls it in.
          messageId: result.messageId || `email_out_${Date.now()}`,
          direction: 'outgoing',
          type: 'email',
          content: {
            body: content,
            participantId: lead.email,
            participantEmail: lead.email,
            participantName: lead.name,
          },
          subject: renderedSubject,
          status: 'sent',
          performedBy,
          origin,          // ← 'automation' | 'sequence' | 'broadcast' | 'user'
          folder: 'sent',
        });
      } catch (recordErr) {
        // Recording failures must not break the send itself — the customer
        // received the mail; we just missed the inbox row.
        console.warn(`${logPrefix} recordChannelMessage failed:`, recordErr.message);
      }
    }

    return result;

  } catch (error) {
    // If sendBusinessEmail threw an error (meaning retries failed), caught here.
    // We return it formatted as failure so the engine can log activities.
    // BUT we must differentiate "business logic error" vs "sending error".
    console.error(`${logPrefix} [EMAIL][CRITICAL FAILURE]`, error);
    return { success: false, error: error.message };
  }
};

// Alias for backward compatibility (if any other files use this)
export const sendLeadMail = sendCustomerEmail;

/**
 * Sends an internal notification to a staff member about a newly assigned lead
 * @param {Object} lead - The lead document
 * @param {Object} business - The business document
 * @param {Object} assignee - The staff member being assigned (User object)
 */
export const sendAssignmentNotification = async (lead, business, assignee) => {
  const logPrefix = `[StaffNotify:${business.businessName}]`;

  try {
    const emailConfig = business.integrationCredentials?.email;
    if (!emailConfig || !emailConfig.enabled) {
      console.warn(`${logPrefix} Skipping staff notification: Email integration not enabled`);
      return { success: false, error: 'Email integration disabled' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://leadforgrow.com';
    const leadUrl = `${baseUrl}/automation/leads/${lead._id}`;

    const subject = `🚀 New Lead Assigned: ${lead.name}`;
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
            .header { background: #4f46e5; padding: 40px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 40px; color: #1e293b; }
            .greeting { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
            .detail-card { background: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px; }
            .detail-row { display: flex; margin-bottom: 12px; }
            .detail-row:last-child { margin-bottom: 0; }
            .label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; width: 100px; }
            .value { color: #0f172a; font-size: 14px; font-weight: 700; flex: 1; }
            .cta { text-align: center; }
            .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s; }
            .footer { padding: 32px; text-align: center; border-t: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Lead Assignment</h1>
            </div>
            <div class="content">
              <div class="greeting">Hi ${assignee.firstName || 'Team Member'},</div>
              <p style="margin-bottom: 32px; line-height: 1.6;">You've just been assigned a new lead from <strong>${business.businessName}</strong>. Please review the details below and take action immediately.</p>
              
              <div class="detail-card">
                <div class="detail-row">
                  <span class="label">Lead Name</span>
                  <span class="value">${lead.name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Source</span>
                  <span class="value" style="text-transform: capitalize;">${lead.source}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Priority</span>
                  <span class="value" style="text-transform: capitalize;">${lead.priority || 'Medium'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email</span>
                  <span class="value">${lead.email || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone</span>
                  <span class="value">${lead.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Service</span>
                  <span class="value">${lead.serviceInterest || 'Not specified'}</span>
                </div>
              </div>

              <div class="cta">
                <a href="${leadUrl}" class="btn">View Lead Details</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LeadForGrow Rev-OS</p>
              <p>Automated Staff Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendBusinessEmail(business, {
      to: assignee.email,
      subject,
      html: emailHTML,
      text: `New Lead Assigned: ${lead.name}. Source: ${lead.source}. View details at: ${leadUrl}`
    });

  } catch (error) {
    console.error(`${logPrefix} [StaffNotify][ERROR]`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send test/verification email using business's Hostinger credentials
 * @param {Object} business - The business document
 * @param {string} targetEmail - Email address to send test to
 * @returns {Object} - { success: boolean, messageId?: string, error?: string }
 */
export const sendWarmingMail = async (business, targetEmail) => {
  const testLead = {
    name: 'Test User',
    email: targetEmail,
    serviceInterest: 'Email Verification'
  };

  const warmingTemplate = `Your LeadForGrow Email integration is now active! \n\nThis test email confirms that your Hostinger SMTP connection is working correctly.`;

  return sendLeadMail(testLead, business, warmingTemplate, `✅ Connection SUCCESS: ${business.businessName}`);
};
