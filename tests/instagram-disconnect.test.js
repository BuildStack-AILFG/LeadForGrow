/**
 * Disconnecting Instagram: the account must stop being used at all, but the customer's data and the saved rules stay.
 * Offline: fetch is replaced with a recorder, no database. Run: node --test tests/instagram-disconnect.test.js
 */
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let Business, mongoose, disconnectInstagram, disableSubscriptions, getInstagramToken, sendInstagramMessage, listInstagramMedia;
const realFetch = globalThis.fetch;
let calls = [];

before(async () => {
  ({ default: mongoose } = await import('mongoose'));
  ({ default: Business } = await import('../models/Business.js'));
  ({ disconnectInstagram } = await import('../lib/social/disconnect.js'));
  ({ disableSubscriptions } = await import('../lib/instagram/subscriptions.js'));
  ({ getInstagramToken, sendInstagramMessage, listInstagramMedia } = await import('../lib/instagram/send.js'));
});
after(() => { globalThis.fetch = realFetch; });

beforeEach(() => {
  calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method || 'GET', auth: opts.headers?.Authorization });
    return { ok: true, json: async () => ({ success: true }) };
  };
});

const connected = (extra = {}) => Business.hydrate({
  _id: new mongoose.Types.ObjectId(),
  businessName: 'Pistons Garage',
  ownerId: new mongoose.Types.ObjectId(),
  integrationCredentials: {
    instagram: {
      enabled: true, pageId: '17841400000000000', igUserId: '17841400000000000', username: 'pistons_garage_official',
      accessToken: 'IGAA_TOKEN', profilePicture: 'https://x/y.jpg', webhookStatus: 'active',
      aiReplyEnabled: true, commentLeadMode: 'all',
      commentAutomations: [{ id: 'r1', keywords: ['price'], dmMessage: 'hi', enabled: true, triggeredCount: 4 }],
      ...extra,
    },
    facebookAds: { enabled: true, accessToken: 'FB_ADS_TOKEN', pageId: '999' },
  },
});

describe('disableSubscriptions', () => {
  it('asks Meta to stop the events: DELETE on this account subscribed_apps with the account own token', async () => {
    const r = await disableSubscriptions(connected());
    assert.equal(r.success, true);
    assert.deepEqual(calls, [{ url: 'https://graph.instagram.com/v21.0/me/subscribed_apps', method: 'DELETE', auth: 'Bearer IGAA_TOKEN' }]);
  });

  it('reports an English error (never raw Meta text) and does not throw when Meta refuses', async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { code: 190, message: 'Sitzung abgelaufen' } }) });
    const r = await disableSubscriptions(connected());
    assert.equal(r.success, false);
    assert.doesNotMatch(r.error, /Sitzung/);
  });

  it('does nothing without a token', async () => {
    const r = await disableSubscriptions(Business.hydrate({ _id: new mongoose.Types.ObjectId(), businessName: 'x', ownerId: new mongoose.Types.ObjectId() }));
    assert.equal(r.skipped, true);
    assert.equal(calls.length, 0);
  });
});

describe('disconnectInstagram', () => {
  it('stops Meta events FIRST (while the token still exists), then clears the connection', async () => {
    const b = connected();
    let tokenSeenByMeta;
    const out = await disconnectInstagram(b, { disable: async (biz) => { tokenSeenByMeta = getInstagramToken(biz); return { success: true }; } });
    assert.equal(tokenSeenByMeta, 'IGAA_TOKEN');
    assert.deepEqual(out.webhook, { attempted: true, success: true });
    const ig = b.integrationCredentials.instagram;
    assert.equal(ig.enabled, false);
    for (const k of ['pageId', 'igUserId', 'username', 'accessToken', 'profilePicture']) assert.equal(ig[k], null, k);
    assert.equal(ig.webhookStatus, 'pending');
    assert.ok(ig.disconnectedAt instanceof Date);
  });

  it('keeps the saved rules and channel settings (they cannot run while disconnected)', async () => {
    const b = connected();
    const out = await disconnectInstagram(b, { disable: async () => ({ success: true }) });
    const ig = b.integrationCredentials.instagram;
    assert.equal(out.keptRules, 1);
    assert.equal(ig.commentAutomations.length, 1);
    assert.equal(ig.commentAutomations[0].triggeredCount, 4);
    assert.equal(ig.aiReplyEnabled, true);
    assert.equal(ig.commentLeadMode, 'all');
  });

  it('a failing or throwing Meta call never blocks the disconnect', async () => {
    for (const disable of [async () => ({ success: false, error: 'Meta down' }), async () => { throw new Error('network'); }]) {
      const b = connected();
      const out = await disconnectInstagram(b, { disable });
      assert.equal(out.webhook.attempted, true);
      assert.equal(out.webhook.success, false);
      assert.equal(b.integrationCredentials.instagram.enabled, false);
      assert.equal(b.integrationCredentials.instagram.accessToken, null);
    }
  });

  it('does not call Meta when there was no token to call it with', async () => {
    const b = connected({ accessToken: null });
    let called = false;
    const out = await disconnectInstagram(b, { disable: async () => { called = true; return { success: true }; } });
    assert.equal(called, false);
    assert.equal(out.webhook.attempted, false);
  });

  it('does not touch the customer data or other channels (facebookAds credentials stay)', async () => {
    const b = connected();
    await disconnectInstagram(b, { disable: async () => ({ success: true }) });
    assert.equal(b.integrationCredentials.facebookAds.accessToken, 'FB_ADS_TOKEN');
    assert.equal(b.integrationCredentials.facebookAds.enabled, true);
  });
});

describe('after disconnecting, the Instagram API is not used at all', () => {
  it('the facebookAds token is NOT used as a fallback for Instagram calls any more', async () => {
    const b = connected();
    await disconnectInstagram(b, { disable: async () => ({ success: true }) });
    assert.equal(getInstagramToken(b), '');
    calls = [];
    const send = await sendInstagramMessage(b, '1789', 'hello');
    const media = await listInstagramMedia(b);
    assert.equal(send.success, false);
    assert.equal(media.success, false);
    assert.equal(calls.length, 0, 'no request may be sent to Meta');
  });

  it('control: without disconnecting, the legacy facebookAds fallback still works; reconnecting (disconnectedAt cleared) restores the token', () => {
    const legacy = Business.hydrate({ _id: new mongoose.Types.ObjectId(), businessName: 'x', ownerId: new mongoose.Types.ObjectId(), integrationCredentials: { facebookAds: { accessToken: 'FB_ADS_TOKEN' } } });
    assert.equal(getInstagramToken(legacy), 'FB_ADS_TOKEN');
    const reconnected = connected({ disconnectedAt: null });
    assert.equal(getInstagramToken(reconnected), 'IGAA_TOKEN');
  });
});
