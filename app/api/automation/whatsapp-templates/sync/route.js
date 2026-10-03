import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WhatsAppTemplate from '@/models/automation/WhatsAppTemplate';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { fetchMetaTemplates } from '@/lib/whatsapp/templates';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();

    const business = await Business.findById(req.user.businessId).select('+integrationCredentials');
    const creds = business?.integrationCredentials?.whatsapp;
    if (!creds?.apiKey || !creds?.businessAccountId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not fully configured. Set API Key and Business Account ID in Integrations.' },
        { status: 400 }
      );
    }

    const metaTemplates = await fetchMetaTemplates({
      apiKey: decrypt(creds.apiKey),
      businessAccountId: creds.businessAccountId,
    });

    let created = 0;
    let updated = 0;

    for (const m of metaTemplates) {
      const existing = await WhatsAppTemplate.findOne({
        businessId: business._id,
        $or: [{ metaTemplateId: m.id }, { name: m.name, language: m.language }],
      });

      const doc = {
        businessId: business._id,
        name: m.name,
        language: m.language,
        category: m.category,
        status: (m.status || 'PENDING').toUpperCase(),
        metaStatus: m.status,
        metaTemplateId: m.id,
        components: m.components || [],
        source: existing?.source || 'imported',
        metaLastCheckedAt: new Date(),
      };
      if (m.rejected_reason) doc.metaRejectionReason = m.rejected_reason;

      if (existing) {
        Object.assign(existing, doc);
        await existing.save();
        updated++;
      } else {
        await WhatsAppTemplate.create(doc);
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: metaTemplates.length,
      message: `Synced ${metaTemplates.length} templates from Meta (${created} new, ${updated} updated)`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
