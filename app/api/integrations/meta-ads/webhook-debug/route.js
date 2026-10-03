import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import Business from '@/models/Business';
import Integration from '@/models/Integration';
import { decryptCredentials } from '@/lib/integrations/credentials';
import { buildWebhookUrl } from '@/lib/integrations/credentials';
import { getCatalogEntry } from '@/lib/integrations/catalog';
import { getRecentWebhookIngress } from '@/lib/meta/webhookIngress';
import { getPageWebhookSubscriptionStatus } from '@/lib/meta/subscribe';

function getBaseUrl(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

/**
 * GET /api/integrations/meta-ads/webhook-debug
 * Webhook pipeline diagnostics — ingress logs, URL match, page subscription.
 */
export const GET = withPlanAccess('integrations', async (req) => {
  const businessId = req.user?.businessId;

  await dbConnect();

  const business = await Business.findById(businessId);
  if (!business) {
    return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
  }

  const entry = getCatalogEntry('meta-ads');
  const baseUrl = getBaseUrl(req);
  const businessWebhookUrl = buildWebhookUrl(baseUrl, entry, business);
  const genericWebhookUrl = `${baseUrl}/api/webhooks/meta`;

  const integration = await Integration.findOne({ businessId, integrationId: 'meta-ads' });
  const decrypted = integration?.credentials
    ? decryptCredentials('meta-ads', integration.credentials)
    : null;

  let pageSubscription = null;
  if (decrypted?.pageId && decrypted?.accessToken) {
    pageSubscription = await getPageWebhookSubscriptionStatus(decrypted.pageId, decrypted.accessToken);
  }

  const pageId = decrypted?.pageId ?? business.integrationCredentials?.facebookAds?.pageId ?? null;

  // Scoped to this business (plus unattributed rows for its Page); never other tenants' traffic.
  const ingressAll = await getRecentWebhookIngress({ businessId, pageId, limit: 30 });
  const ingressForBusiness = ingressAll.filter((row) => String(row.businessId) === String(businessId));

  const ingressSummary = {
    totalRecent: ingressAll.length,
    forThisBusiness: ingressForBusiness.length,
    lastIngressAt: ingressAll[0]?.createdAt ?? null,
    lastIngressRoute: ingressAll[0]?.route ?? null,
    lastIngressOutcome: ingressAll[0]?.outcome ?? null,
    lastLeadgenId: ingressAll[0]?.parsed?.leadgen_id ?? null,
    zeroRequestsReceived: ingressAll.length === 0
  };

  return NextResponse.json({
    success: true,
    data: {
      businessId: businessId.toString(),
      pageId: decrypted?.pageId ?? business.integrationCredentials?.facebookAds?.pageId ?? null,
      configuredUrls: {
        perBusiness: businessWebhookUrl,
        generic: genericWebhookUrl,
        note: 'Meta App Dashboard callback URL must match ONE of these exactly'
      },
      verifyTokens: {
        integrationVerifyTokenSet: Boolean(decrypted?.verifyToken),
        envMetaVerifyTokenSet: Boolean(process.env.META_VERIFY_TOKEN)
      },
      pageSubscription,
      ingressSummary,
      recentIngress: ingressAll.slice(0, 10).map((row) => ({
        id: row._id.toString(),
        route: row.route,
        url: row.url,
        outcome: row.outcome,
        createdAt: row.createdAt,
        leadgen_id: row.parsed?.leadgen_id,
        page_id: row.parsed?.page_id,
        processingStep: row.processing?.step,
        processingError: row.processing?.error,
        signatureVerified: row.signature?.verified,
        signatureReceived: row.signature?.received ? `${String(row.signature.received).slice(0, 20)}…` : null
      })),
      syncVsWebhook: {
        syncPath: 'POST /api/integrations/meta-ads/sync → lib/integrations/testers.js syncMetaAds → lib/meta/ads.js syncMetaLeadsFromLeadCenter → leadManager.processMetaLead',
        webhookPathBusiness: `POST ${businessWebhookUrl} → app/api/webhooks/meta/[businessId]/route.js → lib/meta/leadgenHandler.js → leadManager.processMetaLead`,
        webhookPathGeneric: `POST ${genericWebhookUrl} → app/api/webhooks/meta/route.js → lib/meta/leadgenHandler.js → leadManager.processMetaLead`,
        firstDivergence: [
          'Sync never hits webhook routes or signature verification',
          'Webhook requires Meta POST to reach our server (check ingressSummary.zeroRequestsReceived)',
          'Webhook on [businessId] route verifies x-hub-signature-256 before lead processing (app/api/webhooks/meta/[businessId]/route.js)',
          'Generic route previously dropped leadgen as invalid_payload before leadgenHandler existed (app/api/webhooks/meta/route.js)'
        ]
      }
    }
  });
});
