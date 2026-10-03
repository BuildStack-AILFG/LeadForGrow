import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import AutomationRule from '@/models/automation/AutomationRule';
import { fetchMetaTemplates } from '@/lib/whatsapp/templates';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const business = await Business.findById(tenant.business._id).select('+integrationCredentials');
    const whatsappCreds = business.integrationCredentials?.whatsapp;

    if (!whatsappCreds?.apiKey || !whatsappCreds?.businessAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp not fully configured. Please set API Key and Business Account ID in Integrations.',
        },
        { status: 400 }
      );
    }

    const { decrypt } = await import('@/lib/encryption');
    const metaTemplates = await fetchMetaTemplates({
      apiKey: decrypt(whatsappCreds.apiKey),
      businessAccountId: whatsappCreds.businessAccountId,
    });

    let syncedCount = 0;
    for (const metaT of metaTemplates) {
      const bodyComponent = metaT.components.find((c) => c.type === 'BODY');
      const bodyText = bodyComponent ? bodyComponent.text : '';

      await AutomationRule.findOneAndUpdate(
        { businessId: business._id, type: 'manual_template', 'config.metaTemplateId': metaT.id },
        {
          $set: {
            name: metaT.name,
            enabled: true,
            config: {
              channel: 'whatsapp',
              messageTemplate: bodyText,
              isMetaTemplate: true,
              metaTemplateId: metaT.id,
              metaCategory: metaT.category,
              metaStatus: metaT.status,
              language: metaT.language,
              metaComponents: metaT.components,
            },
          },
        },
        { upsert: true }
      );
      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} templates from Meta!`,
    });
  } catch (error) {
    console.error('[TemplateSync] Error:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) || 'Failed to sync templates' }, { status: 500 });
  }
});
