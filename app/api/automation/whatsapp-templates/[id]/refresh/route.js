import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getMetaTemplateById } from '@/lib/whatsapp/templates';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const template = await WhatsAppTemplate.findOne({ _id: id, businessId: req.user.businessId });
    if (!template) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (!template.metaTemplateId) {
      return NextResponse.json({ success: false, error: 'Not submitted to Meta yet' }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId).select('+integrationCredentials');
    const creds = business?.integrationCredentials?.whatsapp;
    if (!creds?.apiKey) {
      return NextResponse.json({ success: false, error: 'WhatsApp API key missing' }, { status: 400 });
    }

    const metaData = await getMetaTemplateById(
      { apiKey: decrypt(creds.apiKey) },
      template.metaTemplateId
    );

    template.metaStatus = metaData.status;
    template.status = (metaData.status || 'PENDING').toUpperCase();
    if (metaData.rejected_reason) template.metaRejectionReason = metaData.rejected_reason;
    if (metaData.category && metaData.category !== template.category) {
      template.metaCategoryChangedTo = metaData.category;
    }
    template.metaLastCheckedAt = new Date();
    await template.save();

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
