import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { createMetaTemplate } from '@/lib/whatsapp/templates';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

function validateTemplate(t) {
  const errors = [];
  const body = t.components.find((c) => c.type === 'BODY');
  if (!body?.text?.trim()) errors.push('Body text is required');
  if (body?.text?.length > 1024) errors.push('Body must be 1024 chars or fewer');

  const header = t.components.find((c) => c.type === 'HEADER');
  if (header) {
    if (header.format === 'TEXT') {
      if (!header.text?.trim()) errors.push('Header text is required when header is enabled');
      if (header.text?.length > 60) errors.push('Header text must be 60 chars or fewer');
    }
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)) {
      if (!header.example?.header_handle?.length) {
        errors.push(`${header.format.toLowerCase()} header requires a sample media handle (upload sample media)`);
      }
    }
  }

  const footer = t.components.find((c) => c.type === 'FOOTER');
  if (footer && footer.text?.length > 60) errors.push('Footer must be 60 chars or fewer');

  const bodyVars = body?.text?.match(/\{\{\d+\}\}/g) || [];
  if (bodyVars.length) {
    const examples = body?.example?.body_text?.[0] || [];
    if (examples.length !== bodyVars.length) {
      errors.push(`Body uses ${bodyVars.length} variables — provide a sample value for each`);
    }
  }

  const buttons = t.components.find((c) => c.type === 'BUTTONS');
  if (buttons?.buttons?.length > 10) errors.push('Maximum 10 buttons allowed');

  return errors;
}

export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const template = await WhatsAppTemplate.findOne({ _id: id, businessId: req.user.businessId });
    if (!template) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (template.status === 'PENDING') {
      return NextResponse.json({ success: false, error: 'Already submitted — waiting for Meta review' }, { status: 400 });
    }
    if (template.status === 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Already approved' }, { status: 400 });
    }

    const errors = validateTemplate(template);
    if (errors.length) {
      return NextResponse.json({ success: false, error: errors.join('. '), validationErrors: errors }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId).select('+integrationCredentials');
    const creds = business?.integrationCredentials?.whatsapp;
    if (!creds?.apiKey || !creds?.businessAccountId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not fully configured. Set API Key and Business Account ID in Integrations.' },
        { status: 400 }
      );
    }

    const payload = template.toMetaPayload();

    let metaResp;
    try {
      metaResp = await createMetaTemplate(
        { apiKey: decrypt(creds.apiKey), businessAccountId: creds.businessAccountId },
        payload
      );
    } catch (metaErr) {
      template.status = 'DRAFT';
      template.metaRejectionReason = metaErr.message;
      await template.save();
      return NextResponse.json({ success: false, error: metaErr.message, metaError: metaErr.metaError }, { status: 400 });
    }

    template.metaTemplateId = metaResp.id;
    template.metaStatus = metaResp.status || 'PENDING';
    template.status = (metaResp.status || 'PENDING').toUpperCase();
    template.metaSubmittedAt = new Date();
    template.metaLastCheckedAt = new Date();
    template.metaRejectionReason = undefined;
    await template.save();

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
