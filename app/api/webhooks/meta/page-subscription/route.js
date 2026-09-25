import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Integration from '@/models/Integration';
import { decryptCredentials } from '@/lib/integrations/credentials';
import { resolveMetaAdsCredentials } from '@/lib/meta/credentials';
import { metaLog, metaError } from '@/lib/meta/logger';
import { getRecentWebhookIngress } from '@/lib/meta/webhookIngress';
import { withPlanAccess } from '@/lib/accessControl';

const GRAPH_VERSION = 'v25.0';
const EXPECTED_APP_ID = process.env.META_APP_ID || '2089887098254828';
const LEADGEN_FIELD = 'leadgen';

async function graphGet(path, accessToken) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  url.searchParams.set('access_token', accessToken);
  const response = await fetch(url.toString());
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function graphPost(path, accessToken, params) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
  const body = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(url, { method: 'POST', body });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

function tokenFingerprint(token) {
  if (!token || typeof token !== 'string') return null;
  if (token.length < 12) return 'too_short';
  return `${token.slice(0, 6)}…${token.slice(-6)} (len=${token.length})`;
}

function appInSubscriptionList(apps, appId) {
  const list = Array.isArray(apps) ? apps : [];
  return list.find((row) => String(row.id) === String(appId) || String(row.app_id) === String(appId));
}

/**
 * GET  /api/webhooks/meta/page-subscription — inspect page ↔ app subscription (subscribed_apps)
 * POST /api/webhooks/meta/page-subscription — same, and subscribes the Page if it is missing
 * Uses the CRM Page Access Token. Signed-in users only, always for their own business.
 */
export const GET = withPlanAccess('integrations', (req) => inspect(req, { subscribe: false }));
export const POST = withPlanAccess('integrations', (req) => inspect(req, { subscribe: true }));

async function inspect(req, { subscribe }) {
  const businessId = String(req.user.businessId);

  try {
    await dbConnect();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const integration = await Integration.findOne({ businessId, integrationId: 'meta-ads' });
    const metaCreds = await resolveMetaAdsCredentials(business);
    const decrypted = integration?.credentials
      ? decryptCredentials('meta-ads', integration.credentials)
      : null;

    const pageId = metaCreds.pageId || decrypted?.pageId;
    const pageAccessToken = metaCreds.accessToken;
    const crmAppId = metaCreds.appId || decrypted?.appId || null;

    if (!pageId || !pageAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'Page ID or Page Access Token missing in CRM credentials'
      }, { status: 400 });
    }

    metaLog('Page Subscription', `GET subscribed_apps for page ${pageId}`, { businessId, crmAppId });

    const pageValidation = await graphGet(`${pageId}?fields=name,id`, pageAccessToken);
    const pageTokenProbe = await graphGet(`${pageId}?fields=access_token,name,id`, pageAccessToken);

    const getBefore = await graphGet(`${pageId}/subscribed_apps`, pageAccessToken);

    let postSubscribe = null;
    let getAfter = null;
    const beforeApps = getBefore.ok ? (getBefore.data?.data ?? []) : [];
    const expectedPresent = Boolean(appInSubscriptionList(beforeApps, EXPECTED_APP_ID));

    const shouldSubscribe =
      subscribe &&
      (!getBefore.ok || !beforeApps.length || !expectedPresent);

    if (shouldSubscribe) {
      metaLog('Page Subscription', `POST subscribed_apps for page ${pageId}`);
      postSubscribe = await graphPost(`${pageId}/subscribed_apps`, pageAccessToken, {
        subscribed_fields: LEADGEN_FIELD
      });
      getAfter = await graphGet(`${pageId}/subscribed_apps`, pageAccessToken);
    }

    const afterApps = (getAfter ?? getBefore).data?.data ?? [];
    const afterExpectedPresent = Boolean(appInSubscriptionList(afterApps, EXPECTED_APP_ID));

    const ingressForPage = await getRecentWebhookIngress({ businessId, pageId: String(pageId), limit: 20 });

    return NextResponse.json({
      success: true,
      businessId,
      pageId: String(pageId),
      crmAppId: crmAppId ? String(crmAppId) : null,
      expectedAppId: EXPECTED_APP_ID,
      crmAppIdMatchesExpected: crmAppId ? String(crmAppId) === EXPECTED_APP_ID : null,
      graphVersion: GRAPH_VERSION,
      credentialSource: metaCreds.source,
      integrationStatus: integration?.status ?? null,
      integrationUpdatedAt: integration?.updatedAt ?? integration?.connectedAt ?? null,
      storedTokenFingerprint: tokenFingerprint(pageAccessToken),
      pageValidation: {
        httpStatus: pageValidation.status,
        ok: pageValidation.ok,
        response: pageValidation.data
      },
      pageTokenProbe: {
        httpStatus: pageTokenProbe.status,
        ok: pageTokenProbe.ok,
        response: pageTokenProbe.ok
          ? {
              id: pageTokenProbe.data?.id,
              name: pageTokenProbe.data?.name,
              hasAccessToken: Boolean(pageTokenProbe.data?.access_token)
            }
          : pageTokenProbe.data
      },
      step1_get_subscribed_apps: {
        httpStatus: getBefore.status,
        ok: getBefore.ok,
        response: getBefore.data
      },
      step2_post_subscribed_apps: postSubscribe
        ? {
            required: shouldSubscribe,
            httpStatus: postSubscribe.status,
            ok: postSubscribe.ok,
            response: postSubscribe.data
          }
        : {
            required: false,
            reason: !subscribe
              ? 'POST to this endpoint to attempt POST /subscribed_apps'
              : getBefore.ok && expectedPresent
                ? `App ${EXPECTED_APP_ID} already in subscribed_apps`
                : 'POST not attempted'
          },
      step3_get_subscribed_apps_after: getAfter
        ? {
            httpStatus: getAfter.status,
            ok: getAfter.ok,
            response: getAfter.data
          }
        : null,
      summary: {
        tokenValid: pageValidation.ok,
        pageNameFromGraph: pageValidation.data?.name ?? null,
        subscribedAppsReadable: getBefore.ok,
        appsBeforeCount: beforeApps.length,
        appsAfterCount: afterApps.length,
        expectedAppPresentBefore: expectedPresent,
        expectedAppPresentAfter: afterExpectedPresent,
        postSubscribeAttempted: Boolean(postSubscribe),
        postSubscribeSucceeded: postSubscribe?.ok ?? false,
        testingToolHint:
          !afterExpectedPresent
            ? 'Meta Lead Ads Testing Tool shows "no app associated" when page subscribed_apps is empty or does not include your app ID'
            : 'Page is subscribed to expected app — Testing Tool should list this app if you select the same app in Graph API Explorer / Testing Tool'
      },
      errors: [pageValidation, pageTokenProbe, getBefore, postSubscribe, getAfter]
        .filter(Boolean)
        .filter((r) => !r.ok)
        .map((r) => r.data?.error || r.data),
      webhookIngress: {
        configuredUrls: {
          perBusiness: `https://leadforgrow.com/api/webhooks/meta/${businessId}`,
          generic: 'https://leadforgrow.com/api/webhooks/meta'
        },
        metaPostsReceived: ingressForPage.length,
        zeroMetaPostsFromLeadgen: ingressForPage.filter((r) => r.parsed?.leadgen_id).length === 0,
        lastIngress: ingressForPage[0]
          ? {
              route: ingressForPage[0].route,
              url: ingressForPage[0].url,
              outcome: ingressForPage[0].outcome,
              createdAt: ingressForPage[0].createdAt,
              leadgen_id: ingressForPage[0].parsed?.leadgen_id,
              processingStep: ingressForPage[0].processing?.step,
              processingError: ingressForPage[0].processing?.error,
              signatureVerified: ingressForPage[0].signature?.verified
            }
          : null,
        recentIngress: ingressForPage.slice(0, 5).map((row) => ({
          route: row.route,
          outcome: row.outcome,
          createdAt: row.createdAt,
          leadgen_id: row.parsed?.leadgen_id,
          processingStep: row.processing?.step
        }))
      }
    });
  } catch (error) {
    metaError('Page Subscription', 'Diagnostic failed', error);
    return NextResponse.json({ success: false, error: 'Diagnostic failed' }, { status: 500 });
  }
}
