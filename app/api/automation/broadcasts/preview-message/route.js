import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Lead from '@/models/automation/Lead';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { withPlanAccess } from '@/lib/accessControl';
import { resolveTemplateVariables } from '@/lib/broadcasts/engine';

/**
 * Pick one real lead from an audience and render the message they'll receive,
 * with variables actually substituted. Backs the "First recipient will see: …"
 * preview card in the Broadcasts UI.
 */
export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const body = await req.json();
    const { audience = {}, content = {}, channel = 'whatsapp' } = body;

    const query = { businessId, archived: { $ne: true } };
    if (audience.type === 'manual' && audience.leadIds?.length) {
      query._id = { $in: audience.leadIds };
    } else if (audience.type === 'tags' && audience.tags?.length) {
      query.tags = { $in: audience.tags };
    } else if (audience.type === 'filter' && audience.filters) {
      const f = audience.filters;
      if (f.status) query.status = f.status;
      if (f.source) query.source = f.source;
      if (f.tags?.length) query.tags = { $in: f.tags };
    } else {
      return NextResponse.json({ success: true, sample: null });
    }

    if (channel === 'whatsapp' || channel === 'both') {
      query.optedOutOfWhatsApp = { $ne: true };
    }
    if (channel === 'email' || channel === 'both') {
      query.optedOutOfEmail = { $ne: true };
    }

    const lead = await Lead.findOne(query).lean();
    if (!lead) {
      return NextResponse.json({ success: true, sample: null, message: 'No leads in the audience' });
    }

    const resolvedVars = resolveTemplateVariables(content.variableMapping, lead) || [];

    const applyLeadVars = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/\{\{name\}\}/gi, lead.name || '')
        .replace(/\{\{email\}\}/gi, lead.email || '')
        .replace(/\{\{phone\}\}/gi, lead.phone || '')
        .replace(/\{\{lead\.name\}\}/gi, lead.name || '')
        .replace(/\{\{lead\.email\}\}/gi, lead.email || '')
        .replace(/\{\{lead\.phone\}\}/gi, lead.phone || '');
    };

    const applyMetaVars = (text) => {
      if (!text) return '';
      return String(text).replace(/\{\{(\d+)\}\}/g, (_, n) => resolvedVars[Number(n) - 1] || `{{${n}}}`);
    };

    const rendered = {
      to: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
      },
      whatsapp: null,
      email: null,
    };

    if (channel === 'whatsapp' || channel === 'both') {
      // Prefer the stored template — that's the source of truth for what
      // Meta will send. Pull header, body, footer, buttons and render them
      // all with resolved variables.
      let stored = null;
      if (content.whatsappTemplateName) {
        stored = await WhatsAppTemplate.findOne({
          businessId,
          name: String(content.whatsappTemplateName).toLowerCase(),
          language: content.whatsappTemplateLanguage || undefined,
        }).lean();
      }

      const header = stored?.components?.find((c) => (c.type || '').toUpperCase() === 'HEADER');
      const body = stored?.components?.find((c) => (c.type || '').toUpperCase() === 'BODY');
      const footer = stored?.components?.find((c) => (c.type || '').toUpperCase() === 'FOOTER');
      const buttons = stored?.components?.find((c) => (c.type || '').toUpperCase() === 'BUTTONS');

      const bodyText = body?.text || content.whatsappTemplate || content.body || '';

      rendered.whatsapp = {
        templateName: content.whatsappTemplateName,
        header: header ? {
          format: (header.format || 'TEXT').toUpperCase(),
          text: header.format === 'TEXT' ? applyMetaVars(header.text || '') : null,
          filename: header.example?.header_filename || null,
        } : null,
        body: applyMetaVars(applyLeadVars(bodyText)),
        footer: footer?.text || null,
        buttons: (buttons?.buttons || []).map((b) => ({
          type: (b.type || '').toUpperCase(),
          text: b.text || '',
          url: b.url || null,
          phone_number: b.phone_number || null,
        })),
      };
    }
    if (channel === 'email' || channel === 'both') {
      // Resolve the exact signature the send will append, so the preview shows
      // recipients what they'll actually receive. Same code path as the engine
      // (account.resolveSignatureHtml), so preview and send never diverge.
      let signatureHtml = '';
      if (content.emailAccountId) {
        const account = await EmailAccount.findOne({ _id: content.emailAccountId, businessId });
        if (account?.resolveSignatureHtml) {
          signatureHtml = account.resolveSignatureHtml(content.signatureId) || '';
        }
      }
      rendered.email = {
        subject: applyLeadVars(content.subject || ''),
        body: applyLeadVars(content.body || ''),
        // Rich HTML body (vars applied) when the WYSIWYG editor was used.
        bodyHtml: content.bodyHtml ? applyLeadVars(content.bodyHtml) : '',
        signatureHtml,
      };
    }

    return NextResponse.json({ success: true, sample: rendered });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
