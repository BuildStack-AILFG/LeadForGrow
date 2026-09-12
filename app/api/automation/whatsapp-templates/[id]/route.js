import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { deleteMetaTemplate } from '@/lib/whatsapp/templates';
import { decrypt } from '@/lib/encryption';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const template = await WhatsAppTemplate.findOne({ _id: id, businessId: req.user.businessId }).lean();
    if (!template) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const template = await WhatsAppTemplate.findOne({ _id: id, businessId: req.user.businessId });
    if (!template) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Restore from the Deleted tab — handled before the PENDING/APPROVED edit
    // guard below since restoring doesn't touch Meta-submission fields.
    if (body.restore) {
      template.isDeleted = false;
      template.deletedAt = undefined;
      await template.save();
      return NextResponse.json({ success: true, data: template });
    }

    if (template.status === 'PENDING' || template.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: `Cannot edit a ${template.status.toLowerCase()} template. Duplicate it to make changes.` },
        { status: 400 }
      );
    }

    ['category', 'language', 'components'].forEach((k) => {
      if (body[k] !== undefined) template[k] = body[k];
    });
    template.updatedBy = req.user.userId;
    if (template.status === 'REJECTED') template.status = 'DRAFT';
    await template.save();

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const template = await WhatsAppTemplate.findOne({ _id: id, businessId: req.user.businessId });
    if (!template) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (template.metaTemplateId) {
      try {
        const business = await Business.findById(req.user.businessId).select('+integrationCredentials');
        const creds = business?.integrationCredentials?.whatsapp;
        if (creds?.apiKey && creds?.businessAccountId) {
          await deleteMetaTemplate(
            { apiKey: decrypt(creds.apiKey), businessAccountId: creds.businessAccountId },
            template.name
          );
        }
      } catch (metaErr) {
        console.warn('[WhatsAppTemplate] Meta delete failed, removing locally anyway:', metaErr.message);
      }
    }

    // Soft delete — moves the template to the "Deleted" tab instead of
    // destroying the record, so it can be restored. The Meta-side template
    // (if any) is still hard-deleted above; restoring a template that had
    // one will need re-submission since Meta no longer has it.
    template.isDeleted = true;
    template.deletedAt = new Date();
    await template.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
