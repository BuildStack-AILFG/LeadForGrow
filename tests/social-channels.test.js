/**
 * Offline tests for the Instagram / Facebook / Messenger channels.
 *
 * No database, no network: Business model statics are stubbed and global fetch is
 * replaced with a recorder, so we assert the exact Graph API calls we WOULD make.
 * Run: node --test tests/social-channels.test.js
 */
import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let fbHandler, igHandler, fbAuto, igAuto, pickVariant, hasVariation, Business, fbSend, SendCounter, SendSafetyState;
const realFetch = globalThis.fetch;
const realBusinessFind = {};
const realSafety = {};
let fetchCalls = [];
let currentBusiness = null;
let counterUpdates = [];
// Ban-safety state, stubbed in memory: what SendSafetyState.findOne returns, what got written, and every counter call.
let safetyState = null;
let safetyWrites = [];
let counterCalls = [];

before(async () => {
  fbHandler = await import('../lib/facebook/handler.js');
  igHandler = await import('../lib/instagram/handler.js');
  fbAuto = await import('../lib/facebook/commentAutomation.js');
  igAuto = await import('../lib/instagram/commentAutomation.js');
  fbSend = await import('../lib/facebook/send.js');
  ({ pickVariant, hasVariation } = await import('../lib/automation/messageVariation.js'));
  Business = (await import('../models/Business.js')).default;
  realBusinessFind.findById = Business.findById;
  realBusinessFind.updateOne = Business.updateOne;
  SendCounter = (await import('../models/omnichannel/SendCounter.js')).default;
  SendSafetyState = (await import('../models/omnichannel/SendSafetyState.js')).default;
  realSafety.counterUpdateOne = SendCounter.updateOne;
  realSafety.stateFindOne = SendSafetyState.findOne;
  realSafety.stateUpdateOne = SendSafetyState.updateOne;
});

after(() => {
  globalThis.fetch = realFetch;
  Business.findById = realBusinessFind.findById;
  Business.updateOne = realBusinessFind.updateOne;
  SendCounter.updateOne = realSafety.counterUpdateOne;
  SendSafetyState.findOne = realSafety.stateFindOne;
  SendSafetyState.updateOne = realSafety.stateUpdateOne;
});

beforeEach(() => {
  fetchCalls = [];
  counterUpdates = [];
  globalThis.fetch = async (url, opts = {}) => {
    fetchCalls.push({ url: String(url), method: opts.method, headers: opts.headers, body: opts.body ? JSON.parse(opts.body) : null });
    return { ok: true, json: async () => ({ id: 'reply_1', message_id: 'mid_1' }) };
  };
  Business.findById = async () => currentBusiness;
  Business.updateOne = async (filter, update) => { counterUpdates.push({ filter, update }); return {}; };

  // Safety layer: no DB. Counters always have room unless a test overrides SendCounter.updateOne; state writes
  // are applied to the in-memory state so a later read in the same test sees them (like the real DB would).
  safetyState = null;
  safetyWrites = [];
  counterCalls = [];
  SendCounter.updateOne = async (filter, update) => { counterCalls.push({ filter, update }); return {}; };
  SendSafetyState.findOne = () => ({ lean: async () => safetyState });
  SendSafetyState.updateOne = async (filter, update) => {
    safetyWrites.push({ filter, update });
    safetyState = { ...(safetyState || {}), ...(update.$set || {}), ...(update.$setOnInsert && !safetyState ? update.$setOnInsert : {}) };
    for (const [k, v] of Object.entries(update.$set || {})) if (k.includes('.')) { const [a, b] = k.split('.'); safetyState[a] = { ...(safetyState[a] || {}), [b]: v }; delete safetyState[k]; }
    return {};
  };
});

const rule = (over = {}) => ({
  id: 'r1', enabled: true, keywords: ['price'], matchType: 'contains', mediaId: '',
  publicReply: '', dmMessage: '', replyMode: 'static', ...over,
});

const fbBusiness = (rules) => ({
  _id: 'biz1',
  integrationCredentials: { facebook: { pageId: 'PAGE1', accessToken: 'TOKEN', commentAutomations: rules } },
});
const igBusiness = (rules) => ({
  _id: 'biz1',
  integrationCredentials: { instagram: { pageId: 'IG1', accessToken: 'TOKEN', commentAutomations: rules } },
});

// ───────────────────────── Messenger parsing ─────────────────────────
describe('Facebook: Messenger event parsing', () => {
  it('parses a text DM', () => {
    const ev = fbHandler.parseMessengerEvents({
      id: 'PAGE1',
      messaging: [{ sender: { id: 'U1' }, recipient: { id: 'PAGE1' }, timestamp: 1700000000000, message: { mid: 'm1', text: 'hello' } }],
    });
    assert.equal(ev.length, 1);
    assert.deepEqual([ev[0].type, ev[0].messageId, ev[0].senderId, ev[0].text], ['message', 'm1', 'U1', 'hello']);
  });

  it('flags echoes so the handler can skip them', () => {
    const [ev] = fbHandler.parseMessengerEvents({ messaging: [{ sender: { id: 'PAGE1' }, message: { mid: 'm2', text: 'hi', is_echo: true } }] });
    assert.equal(ev.isEcho, true);
  });

  it('emits read receipts separately and ignores delivery/postback', () => {
    const ev = fbHandler.parseMessengerEvents({
      messaging: [
        { sender: { id: 'U1' }, read: { watermark: 1 } },
        { sender: { id: 'U1' }, delivery: { mids: ['x'] } },
        { sender: { id: 'U1' }, postback: { payload: 'p' } },
      ],
    });
    assert.deepEqual(ev.map((e) => e.type), ['read']);
  });

  it('carries attachments through', () => {
    const [ev] = fbHandler.parseMessengerEvents({ messaging: [{ sender: { id: 'U1' }, message: { mid: 'm3', attachments: [{ type: 'image', payload: { url: 'https://x/y.jpg' } }] } }] });
    assert.equal(ev.attachments[0].payload.url, 'https://x/y.jpg');
  });

  it('returns [] for an entry without messaging', () => {
    assert.deepEqual(fbHandler.parseMessengerEvents({ id: 'PAGE1' }), []);
    assert.deepEqual(fbHandler.parseMessengerEvents(undefined), []);
  });
});

describe('Facebook: processMessengerEvent short-circuits (no DB touched)', () => {
  it('skips echoes and non-message events', async () => {
    assert.equal((await fbHandler.processMessengerEvent('b', { type: 'message', isEcho: true })).status, 'skipped');
    assert.equal((await fbHandler.processMessengerEvent('b', { type: 'read' })).status, 'skipped');
  });
});

// ───────────────────────── Facebook comment parsing ─────────────────────────
describe('Facebook: feed comment parsing', () => {
  const change = (value) => ({ id: 'PAGE1', changes: [{ field: 'feed', value }] });
  const good = { item: 'comment', verb: 'add', comment_id: 'C1', post_id: 'P_1', parent_id: 'P_1', from: { id: 'U1', name: 'Asha' }, message: 'price?', created_time: 1700000000 };

  it('parses a new comment', () => {
    const [ev] = fbHandler.parseFacebookComments(change(good));
    assert.deepEqual([ev.commentId, ev.mediaId, ev.commenterId, ev.commenterName, ev.text], ['C1', 'P_1', 'U1', 'Asha', 'price?']);
  });
  it('ignores edited / removed comments', () => {
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, verb: 'edited' })).length, 0);
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, verb: 'remove' })).length, 0);
  });
  it('ignores the Page\'s own comments (prevents reply loops)', () => {
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, from: { id: 'PAGE1' } })).length, 0);
  });
  it('ignores non-comment feed items (posts, reactions)', () => {
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, item: 'post' })).length, 0);
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, item: 'reaction' })).length, 0);
  });
  it('ignores comments with no author id', () => {
    assert.equal(fbHandler.parseFacebookComments(change({ ...good, from: undefined })).length, 0);
  });
  it('ignores non-feed change fields', () => {
    assert.equal(fbHandler.parseFacebookComments({ id: 'PAGE1', changes: [{ field: 'leadgen', value: good }] }).length, 0);
  });
  it('falls back to value.id when comment_id is absent', () => {
    const { comment_id, ...rest } = good;
    const [ev] = fbHandler.parseFacebookComments(change({ ...rest, id: 'FALLBACK' }));
    assert.equal(ev.commentId, 'FALLBACK');
  });
});

// ───────────────────────── Instagram parsing ─────────────────────────
describe('Instagram: DM + comment parsing', () => {
  it('parses DM, echo, deleted and story-reply flags', () => {
    const evs = igHandler.parseInstagramMessaging({
      messaging: [
        { sender: { id: 'U1' }, message: { mid: 'a', text: 'hi' } },
        { sender: { id: 'IG1' }, message: { mid: 'b', text: 'x', is_echo: true } },
        { sender: { id: 'U1' }, message: { mid: 'c', is_deleted: true } },
        { sender: { id: 'U1' }, message: { mid: 'd', text: 'nice', reply_to: { story: { id: 's' } } } },
      ],
    });
    assert.ok(!evs[0].isEcho);
    assert.equal(evs[1].isEcho, true);
    assert.equal(evs[2].isDeleted, true);
    assert.equal(evs[3].isStoryReply, true);
  });

  it('parses a comment and skips our own', () => {
    const entry = (fromId) => ({ id: 'IG1', changes: [{ field: 'comments', value: { id: 'IC1', text: 'price', from: { id: fromId, username: 'asha' }, media: { id: 'M1', media_product_type: 'REELS' }, created_time: 1700000000 } }] });
    const [ev] = igHandler.parseInstagramChanges(entry('U1'));
    assert.deepEqual([ev.commentId, ev.mediaId, ev.commenterUsername, ev.mediaType], ['IC1', 'M1', 'asha', 'REELS']);
    assert.equal(igHandler.parseInstagramChanges(entry('IG1')).length, 0);
  });

  it('skips echo/deleted DMs without touching the DB', async () => {
    assert.equal((await igHandler.processInstagramEvent('b', { type: 'message', isEcho: true })).status, 'skipped');
    assert.equal((await igHandler.processInstagramEvent('b', { type: 'message', isDeleted: true })).status, 'skipped');
  });
});

// ───────────────────────── Message variation ─────────────────────────
describe('Message variation (ban-safety)', () => {
  it('leaves {{tokens}} untouched', () => {
    assert.equal(pickVariant('Hi {{customer_name}}, thanks!'), 'Hi {{customer_name}}, thanks!');
  });
  it('spintax picks one option per group', () => {
    const seen = new Set();
    for (let i = 0; i < 60; i++) seen.add(pickVariant('{Hi|Hey|Hello} there'));
    assert.deepEqual([...seen].sort(), ['Hello there', 'Hey there', 'Hi there']);
  });
  it('||| picks a whole variant', () => {
    const seen = new Set();
    for (let i = 0; i < 60; i++) seen.add(pickVariant('A one ||| B two'));
    assert.deepEqual([...seen].sort(), ['A one', 'B two']);
  });
  it('handles empty/undefined and detects variation syntax', () => {
    assert.equal(pickVariant(''), '');
    assert.equal(pickVariant(undefined), '');
    assert.equal(hasVariation('{a|b}'), true);
    assert.equal(hasVariation('{{x}}'), false);
  });
});

// ───────────────────────── Facebook send (Graph API shape) ─────────────────────────
describe('Facebook: Graph API request shapes', () => {
  it('Messenger DM → POST /{pageId}/messages with recipient.id', async () => {
    const r = await fbSend.sendMessengerMessage(fbBusiness([]), 'PSID1', 'hello');
    assert.equal(r.success, true);
    const c = fetchCalls[0];
    assert.equal(c.url, 'https://graph.facebook.com/v21.0/PAGE1/messages');
    assert.deepEqual(c.body.recipient, { id: 'PSID1' });
    assert.equal(c.body.messaging_type, 'RESPONSE');
    assert.equal(c.headers.Authorization, 'Bearer TOKEN');
  });
  it('public comment reply → POST /{commentId}/comments', async () => {
    await fbSend.sendFacebookCommentReply(fbBusiness([]), 'C1', ' thanks ');
    assert.equal(fetchCalls[0].url, 'https://graph.facebook.com/v21.0/C1/comments');
    assert.equal(fetchCalls[0].body.message, 'thanks');
  });
  it('private reply → recipient.comment_id (not recipient.id)', async () => {
    await fbSend.sendFacebookPrivateReply(fbBusiness([]), 'C1', 'dm');
    assert.deepEqual(fetchCalls[0].body.recipient, { comment_id: 'C1' });
  });
  it('refuses to send when not configured', async () => {
    const r = await fbSend.sendMessengerMessage({ integrationCredentials: {} }, 'PSID1', 'x');
    assert.equal(r.success, false);
    assert.equal(fetchCalls.length, 0);
  });
  it('surfaces Meta API errors', async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: 'Session expired' } }) });
    const r = await fbSend.sendMessengerMessage(fbBusiness([]), 'PSID1', 'x');
    assert.equal(r.success, false);
    assert.equal(r.error, 'Session expired');
  });
  it('falls back to the lead-ads facebookAds page token', async () => {
    await fbSend.sendMessengerMessage({ integrationCredentials: { facebookAds: { pageId: 'ADPAGE', accessToken: 'ADTOKEN' } } }, 'PSID1', 'x');
    assert.equal(fetchCalls[0].url, 'https://graph.facebook.com/v21.0/ADPAGE/messages');
  });
});

// ───────────────────────── Comment automation: matching (both channels) ─────────────────────────
for (const [name, mod, mk, fn, ev] of [
  ['Facebook', () => fbAuto, fbBusiness, 'runFacebookCommentAutomations', (o) => ({ commentId: 'C1', mediaId: 'P_1', commenterId: 'U1', commenterName: 'Asha', text: 'what is the price', ...o })],
  ['Instagram', () => igAuto, igBusiness, 'runCommentAutomations', (o) => ({ commentId: 'C1', mediaId: 'M1', commenterId: 'U1', commenterUsername: 'asha', text: 'what is the price', ...o })],
]) {
  describe(`${name}: keyword comment automation`, () => {
    const run = (rules, event) => { currentBusiness = mk(rules); return mod()[fn]('biz1', event); };

    it('fires on whole-word contains match, not on substrings', async () => {
      assert.equal((await run([rule({ publicReply: 'ok' })], ev({ text: 'Price please' }))).matched, 1);
      fetchCalls = [];
      assert.equal((await run([rule({ publicReply: 'ok' })], ev({ text: 'that is pricey' }))).matched, 0);
      assert.equal(fetchCalls.length, 0);
    });
    it('exact match requires the whole comment to equal a keyword', async () => {
      assert.equal((await run([rule({ matchType: 'exact', publicReply: 'ok' })], ev({ text: 'price' }))).matched, 1);
      assert.equal((await run([rule({ matchType: 'exact', publicReply: 'ok' })], ev({ text: 'the price?' }))).matched, 0);
    });
    it('is case-insensitive and regex-safe', async () => {
      assert.equal((await run([rule({ keywords: ['C++ (pro)'], publicReply: 'ok' })], ev({ text: 'i love c++ (pro) !' }))).matched, 1);
    });
    it('skips disabled rules and rules with no keywords', async () => {
      assert.equal((await run([rule({ enabled: false, publicReply: 'ok' })], ev())).matched, 0);
      assert.equal((await run([rule({ keywords: [], publicReply: 'ok' })], ev())).matched, 0);
    });
    it('respects the per-post filter', async () => {
      assert.equal((await run([rule({ mediaId: 'OTHER', publicReply: 'ok' })], ev())).matched, 0);
      const mid = ev().mediaId;
      assert.equal((await run([rule({ mediaId: mid, publicReply: 'ok' })], ev())).matched, 1);
    });
    it('first matching rule wins (one reply per comment) and bumps triggeredCount', async () => {
      const r = await run([rule({ id: 'a', publicReply: 'first' }), rule({ id: 'b', publicReply: 'second' })], ev());
      assert.equal(r.matched, 1);
      const bodies = fetchCalls.map((c) => c.body.message);
      assert.deepEqual(bodies, ['first']);
      assert.equal(counterUpdates.length, 1);
      assert.equal(counterUpdates[0].filter['integrationCredentials.' + name.toLowerCase() + '.commentAutomations.id'], 'a');
    });
    it('sends nothing when no rules are configured', async () => {
      assert.deepEqual(await run([], ev()), { matched: 0 });
      assert.equal(fetchCalls.length, 0);
    });
    it('AI mode with no AI provider configured falls back to the static DM', async () => {
      await run([rule({ replyMode: 'ai', dmMessage: 'static fallback' })], ev());
      assert.ok(fetchCalls.some((c) => c.body?.message?.text === 'static fallback'), 'expected static DM fallback');
    });
    it('static rule with no dmMessage sends no DM', async () => {
      await run([rule({ publicReply: 'ok', dmMessage: '' })], ev());
      assert.equal(fetchCalls.length, 1); // only the public reply
    });
  });
}

// ───────────────────────── Where the two channels' DM paths differ ─────────────────────────
describe('Comment → DM request shape', () => {
  it('Facebook DMs the commenter via a private reply (recipient.comment_id)', async () => {
    currentBusiness = fbBusiness([rule({ dmMessage: 'dm' })]);
    await fbAuto.runFacebookCommentAutomations('biz1', { commentId: 'C1', mediaId: 'P', commenterId: 'U1', text: 'price' });
    const dm = fetchCalls.find((c) => c.body?.message?.text === 'dm');
    assert.deepEqual(dm.body.recipient, { comment_id: 'C1' });
  });

  // Instagram's Messaging API only lets you DM a commenter who has not messaged you
  // first through a *private reply*: recipient = { comment_id } (one per comment,
  // within 7 days). Plain recipient.id only works inside the 24h window after the
  // user messages you.
  it('Instagram DMs the commenter via a private reply (recipient.comment_id)', async () => {
    currentBusiness = igBusiness([rule({ dmMessage: 'dm' })]);
    await igAuto.runCommentAutomations('biz1', { commentId: 'IC1', mediaId: 'M', commenterId: 'U1', text: 'price' });
    const dm = fetchCalls.find((c) => c.body?.message?.text === 'dm');
    assert.deepEqual(dm.body.recipient, { comment_id: 'IC1' });
    assert.equal(dm.url, 'https://graph.instagram.com/v21.0/IG1/messages');
    assert.equal(fetchCalls.length, 1, 'no fallback DM when the private reply succeeds');
  });

  it('Instagram falls back to a plain DM when Meta rejects the private reply', async () => {
    currentBusiness = igBusiness([rule({ dmMessage: 'dm' })]);
    let n = 0;
    globalThis.fetch = async (url, opts = {}) => {
      const body = JSON.parse(opts.body);
      fetchCalls.push({ url: String(url), body });
      n += 1;
      return n === 1
        ? { ok: false, json: async () => ({ error: { message: 'Already replied', code: 10 } }) }
        : { ok: true, json: async () => ({ message_id: 'mid' }) };
    };
    await igAuto.runCommentAutomations('biz1', { commentId: 'IC1', mediaId: 'M', commenterId: 'U1', text: 'price' });
    assert.deepEqual(fetchCalls.map((c) => Object.keys(c.body.recipient)[0]), ['comment_id', 'id']);
    assert.deepEqual(fetchCalls[1].body.recipient, { id: 'U1' });
  });

  it('Instagram send errors include Meta\'s error code for diagnosis', async () => {
    const { sendInstagramMessage } = await import('../lib/instagram/send.js');
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: 'Invalid OAuth access token', code: 190, error_subcode: 463 } }) });
    const r = await sendInstagramMessage(igBusiness([]), 'U1', 'x');
    assert.equal(r.error, 'Your Instagram connection has expired or was disconnected. Reconnect it in Settings → Instagram. (Meta code 190/463)');
  });
});

// ───────────────────────── Post scope: any / one / next ─────────────────────────
describe('Comment automation post scope', () => {
  const FROM = new Date('2026-09-19T10:00:00Z');
  const IG_POSTS = [
    // newest first, like Meta returns them
    { id: 'C_new', caption: 'later', timestamp: '2026-09-19T12:00:00+0000', media_type: 'IMAGE', media_url: 'u3', permalink: 'p3' },
    { id: 'B_next', caption: 'the next one', timestamp: '2026-09-19T11:00:00+0000', media_type: 'IMAGE', media_url: 'u2', permalink: 'p2' },
    { id: 'A_old', caption: 'older', timestamp: '2026-09-19T09:00:00+0000', media_type: 'IMAGE', media_url: 'u1', permalink: 'p1' },
  ];
  const run = (rules, event) => {
    currentBusiness = igBusiness(rules);
    return igAuto.runCommentAutomations('biz1', { commentId: 'IC1', commenterId: 'U1', text: 'price', ...event });
  };
  const listCalls = () => fetchCalls.filter((c) => c.url.includes('/me/media'));
  const withMediaList = (data = IG_POSTS, ok = true) => {
    globalThis.fetch = async (url, opts = {}) => {
      fetchCalls.push({ url: String(url), method: opts.method, body: opts.body ? JSON.parse(opts.body) : null });
      return String(url).includes('/me/media')
        ? { ok, json: async () => (ok ? { data } : { error: { message: 'Permission denied', code: 10 } }) }
        : { ok: true, json: async () => ({ id: 'r', message_id: 'm' }) };
    };
  };

  it('legacy rules keep their behaviour (mediaId means specific, none means all)', async () => {
    const { effectiveScope } = await import('../lib/automation/postScope.js');
    assert.equal(effectiveScope({ mediaId: 'X' }), 'specific');
    assert.equal(effectiveScope({ mediaId: '' }), 'all');
    assert.equal(effectiveScope({ scope: 'next' }), 'next');
  });

  it('"specific" with no post chosen never fires (never silently account-wide)', async () => {
    assert.equal((await run([rule({ scope: 'specific', mediaId: '', publicReply: 'ok' })], { mediaId: 'M' })).matched, 0);
  });

  it('a Facebook post id matches on its trailing part', async () => {
    currentBusiness = fbBusiness([rule({ scope: 'specific', mediaId: 'PAGE1_555', publicReply: 'ok' })]);
    const r = await fbAuto.runFacebookCommentAutomations('biz1', { commentId: 'C', commenterId: 'U', text: 'price', mediaId: '555' });
    assert.equal(r.matched, 1);
  });

  it('"next": attaches to the earliest post published after the rule, and fires', async () => {
    withMediaList();
    const rules = [rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })];
    const r = await run(rules, { mediaId: 'B_next' });
    assert.equal(r.matched, 1);
    assert.equal(rules[0].mediaId, 'B_next');
    const bind = counterUpdates.find((u) => u.update.$set);
    assert.equal(bind.update.$set['integrationCredentials.instagram.commentAutomations.$.mediaId'], 'B_next');
    assert.equal(bind.update.$set['integrationCredentials.instagram.commentAutomations.$.mediaCaption'], 'the next one');
  });

  it('"next": once attached, later comments match without calling Meta again', async () => {
    withMediaList();
    const rules = [rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })];
    await run(rules, { mediaId: 'B_next' });
    const before = listCalls().length;
    assert.equal((await run(rules, { mediaId: 'B_next', commentId: 'IC2' })).matched, 1);
    assert.equal(listCalls().length, before);
    assert.equal((await run(rules, { mediaId: 'C_new', commentId: 'IC3' })).matched, 0, 'attached rule ignores other posts');
  });

  it('"next": ignores comments on older posts and on later uploads', async () => {
    withMediaList();
    assert.equal((await run([rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })], { mediaId: 'A_old' })).matched, 0);
    assert.equal((await run([rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })], { mediaId: 'C_new' })).matched, 0);
    assert.equal(counterUpdates.filter((u) => u.update.$set).length, 0, 'must not attach to the wrong post');
  });

  it('"next": nothing published yet after the rule means it does not fire', async () => {
    withMediaList([IG_POSTS[2]]);
    assert.equal((await run([rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })], { mediaId: 'A_old' })).matched, 0);
  });

  it('"next": if Meta cannot list posts, fail closed (no reply sent)', async () => {
    withMediaList(null, false);
    const r = await run([rule({ scope: 'next', appliesFrom: FROM, publicReply: 'ok' })], { mediaId: 'B_next' });
    assert.equal(r.matched, 0);
    assert.equal(fetchCalls.filter((c) => c.body?.message).length, 0);
  });

  it('listInstagramMedia normalises posts (reel type, video thumbnail, caption cap)', async () => {
    const { listInstagramMedia } = await import('../lib/instagram/send.js');
    withMediaList([{ id: 'R1', caption: 'x'.repeat(300), media_type: 'VIDEO', media_product_type: 'REELS', thumbnail_url: 'thumb', media_url: 'vid', permalink: 'pl', timestamp: 't' }]);
    const res = await listInstagramMedia(igBusiness([]));
    assert.equal(res.posts[0].type, 'reel');
    assert.equal(res.posts[0].thumbnail, 'thumb');
    assert.equal(res.posts[0].caption.length, 140);
  });
});

describe('Comment rule save/serialise', () => {
  let sanitize, serialize;
  before(async () => ({ sanitizeCommentRules: sanitize, serializeCommentRule: serialize } = await import('../lib/automation/commentRules.js')));

  it('derives scope for legacy rules and clears the post for "all"', () => {
    const [a, b] = sanitize([{ id: 'a', keywords: ['x'], mediaId: 'M1' }, { id: 'b', keywords: ['x'], scope: 'all', mediaId: 'M2' }]);
    assert.deepEqual([a.scope, a.mediaId, b.scope, b.mediaId], ['specific', 'M1', 'all', '']);
  });

  it('a client cannot backdate "next" (the server owns appliesFrom)', () => {
    const [r] = sanitize([{ id: 'n', keywords: ['x'], scope: 'next', appliesFrom: '2000-01-01' }]);
    assert.ok(Date.now() - new Date(r.appliesFrom).getTime() < 5000);
  });

  it('re-saving a waiting "next" rule keeps its original start time', () => {
    const start = new Date('2026-09-01T00:00:00Z');
    const [r] = sanitize([{ id: 'n', keywords: ['x'], scope: 'next' }], [{ id: 'n', scope: 'next', appliesFrom: start, mediaId: '' }]);
    assert.equal(new Date(r.appliesFrom).getTime(), start.getTime());
  });

  it('a stale browser tab cannot un-attach a "next" rule that already attached', () => {
    const [r] = sanitize([{ id: 'n', keywords: ['x'], scope: 'next', mediaId: '' }], [{ id: 'n', scope: 'next', appliesFrom: new Date(), mediaId: 'B_next', mediaThumb: 't' }]);
    assert.equal(r.mediaId, 'B_next');
    assert.equal(r.mediaThumb, 't');
  });

  it('rearm detaches and restarts the clock', () => {
    const old = new Date('2026-09-01T00:00:00Z');
    const [r] = sanitize([{ id: 'n', keywords: ['x'], scope: 'next', rearm: true }], [{ id: 'n', scope: 'next', appliesFrom: old, mediaId: 'B_next' }]);
    assert.equal(r.mediaId, '');
    assert.ok(new Date(r.appliesFrom) > old);
  });

  it('serialised legacy rules expose a derived scope', () => {
    assert.equal(serialize({ id: 'x', mediaId: 'M' }).scope, 'specific');
    assert.equal(serialize({ id: 'x' }).scope, 'all');
  });
});

// ───────────────────────── Instagram webhook subscriptions ─────────────────────────
describe('Instagram webhook subscriptions', () => {
  let subs;
  before(async () => { subs = await import('../lib/instagram/subscriptions.js'); });

  const stubMeta = (currentFields, { failPost = false } = {}) => {
    let fields = [...currentFields];
    globalThis.fetch = async (url, opts = {}) => {
      fetchCalls.push({ url: String(url), method: opts.method || 'GET', headers: opts.headers });
      if (opts.method === 'POST') {
        if (failPost) return { ok: false, json: async () => ({ error: { message: 'Permission denied', code: 200 } }) };
        fields = new URL(url).searchParams.get('subscribed_fields').split(',');
        return { ok: true, json: async () => ({ success: true }) };
      }
      return { ok: true, json: async () => ({ data: [{ id: 'app', subscribed_fields: fields }] }) };
    };
  };

  it('reads the fields the account is subscribed to', async () => {
    stubMeta(['messages']);
    const r = await subs.getSubscribedFields(igBusiness([]));
    assert.deepEqual(r, { success: true, fields: ['messages'] });
    assert.equal(fetchCalls[0].url, 'https://graph.instagram.com/v21.0/me/subscribed_apps');
    assert.equal(fetchCalls[0].headers.Authorization, 'Bearer TOKEN');
  });

  it('enabling adds comments+messages and keeps fields the account already had', async () => {
    stubMeta(['messages', 'messaging_postbacks']);
    const r = await subs.enableSubscriptions(igBusiness([]));
    assert.equal(r.success, true);
    assert.deepEqual([...r.fields].sort(), ['comments', 'messages', 'messaging_postbacks']);
    const post = fetchCalls.find((c) => c.method === 'POST');
    assert.deepEqual(new URL(post.url).searchParams.get('subscribed_fields').split(',').sort(), ['comments', 'messages', 'messaging_postbacks']);
  });

  it('reports Meta rejections with the error code', async () => {
    stubMeta([], { failPost: true });
    const r = await subs.enableSubscriptions(igBusiness([]));
    assert.equal(r.success, false);
    assert.equal(r.error, "Meta hasn't given this app permission for that action. Reconnect Instagram and approve all requested permissions. (Meta code 200)");
  });

  it('does nothing when Instagram is not configured', async () => {
    const r = await subs.enableSubscriptions({ integrationCredentials: {} });
    assert.equal(r.success, false);
    assert.equal(fetchCalls.length, 0);
  });
});

// ───────────────────────── "Create a lead from": matched vs all ─────────────────────────
describe('Comment lead-creation switch', () => {
  let WebhookLog, commentLeadMode;
  const realWL = {};
  before(async () => {
    WebhookLog = (await import('../models/automation/WebhookLog.js')).default;
    ({ commentLeadMode } = await import('../lib/automation/commentMatch.js'));
    realWL.findOne = WebhookLog.findOne;
    realWL.findOneAndUpdate = WebhookLog.findOneAndUpdate;
  });
  after(() => { WebhookLog.findOne = realWL.findOne; WebhookLog.findOneAndUpdate = realWL.findOneAndUpdate; });
  beforeEach(() => {
    WebhookLog.findOne = async () => null;
    // Anything past the gate would start writing the lead — make that observable without a DB.
    WebhookLog.findOneAndUpdate = async () => { throw new Error('PAST_GATE'); };
  });

  const igEv = (o = {}) => ({ commentId: 'IC9', mediaId: 'M1', commenterId: 'U9', commenterUsername: 'x', text: 'price?', ...o });
  const fbEv = (o = {}) => ({ commentId: 'FC9', mediaId: 'P1', commenterId: 'U9', commenterName: 'X', text: 'price?', ...o });
  const igBiz = (rules, extra = {}) => ({ _id: 'biz1', integrationCredentials: { instagram: { pageId: 'IG1', accessToken: 'T', commentAutomations: rules, ...extra } } });
  const fbBiz = (rules, extra = {}) => ({ _id: 'biz1', integrationCredentials: { facebook: { pageId: 'P', accessToken: 'T', commentAutomations: rules, ...extra } } });

  it('defaults to "matched" unless explicitly set to "all"', () => {
    assert.equal(commentLeadMode({ integrationCredentials: { instagram: {} } }, 'instagram'), 'matched');
    assert.equal(commentLeadMode({ integrationCredentials: { instagram: { commentLeadMode: 'all' } } }, 'instagram'), 'all');
    assert.equal(commentLeadMode({ integrationCredentials: { facebook: { commentLeadMode: 'junk' } } }, 'facebook'), 'matched');
    assert.equal(commentLeadMode(null, 'instagram'), 'matched');
  });

  it('IG matched mode: a comment with no matching rule creates nothing', async () => {
    currentBusiness = igBiz([rule({ keywords: ['price'] })]);
    const r = await igHandler.processInstagramCommentEvent('biz1', igEv({ text: 'nice post!' }));
    assert.deepEqual(r, { status: 'skipped', reason: 'no_rule_match' });
  });

  it('IG matched mode: no rules at all also creates nothing', async () => {
    currentBusiness = igBiz([]);
    assert.equal((await igHandler.processInstagramCommentEvent('biz1', igEv())).reason, 'no_rule_match');
  });

  it('IG matched mode: right keyword but wrong post creates nothing', async () => {
    currentBusiness = igBiz([rule({ scope: 'specific', mediaId: 'OTHER', publicReply: 'ok' })]);
    assert.equal((await igHandler.processInstagramCommentEvent('biz1', igEv())).reason, 'no_rule_match');
  });

  it('IG matched mode: a disabled rule does not count', async () => {
    currentBusiness = igBiz([rule({ enabled: false })]);
    assert.equal((await igHandler.processInstagramCommentEvent('biz1', igEv())).reason, 'no_rule_match');
  });

  it('IG matched mode: a matching comment proceeds to create the lead', async () => {
    currentBusiness = igBiz([rule({ keywords: ['price'] })]);
    await assert.rejects(igHandler.processInstagramCommentEvent('biz1', igEv()), /PAST_GATE/);
  });

  it('IG "all" mode: even a non-matching comment proceeds to create the lead', async () => {
    currentBusiness = igBiz([rule({ keywords: ['price'] })], { commentLeadMode: 'all' });
    await assert.rejects(igHandler.processInstagramCommentEvent('biz1', igEv({ text: 'nice post!' })), /PAST_GATE/);
  });

  it('FB matched mode skips non-matching, FB "all" mode lets it through', async () => {
    currentBusiness = fbBiz([rule({ keywords: ['price'] })]);
    assert.equal((await fbHandler.processFacebookCommentEvent('biz1', fbEv({ text: 'hello' }))).reason, 'no_rule_match');
    currentBusiness = fbBiz([rule({ keywords: ['price'] })], { commentLeadMode: 'all' });
    await assert.rejects(fbHandler.processFacebookCommentEvent('biz1', fbEv({ text: 'hello' })), /PAST_GATE/);
  });
});

// ───────────────────────── Meta errors are always English ─────────────────────────
describe('Meta error messages (English only)', () => {
  let describeMetaError, metaErrorText;
  before(async () => ({ describeMetaError, metaErrorText } = await import('../lib/social/metaErrors.js')));

  // Meta localises error.message to the account's language; these are the exact Hindi strings we saw live.
  const HINDI_BLOCK = 'इस फ़ीचर के पिछले उपयोग के आधार पर, आपके अकाउंट को कुछ समय तक यह एक्शन करने से ब्लॉक किया गया है।';
  const HINDI_PRIVATE = "यह कमेंट 'प्राइवेट' जवाब के लिए अमान्य है";
  const nonLatin = /[^ -ɏ‐-‧₠-⃏\s]/;

  it('the live Hindi "action blocked" error (368/1404169) becomes English and keeps the code', () => {
    const r = describeMetaError({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }, { channel: 'instagram' });
    assert.equal(r.kind, 'action_blocked');
    assert.equal(r.retry, true);
    assert.match(r.message, /temporarily limited messaging/);
    assert.match(r.message, /\(Meta code 368\/1404169\)$/);
    assert.ok(!nonLatin.test(r.message), 'no Hindi characters may reach the user');
  });

  it('the live Hindi private-reply error (100/2534025) becomes English', () => {
    const r = describeMetaError({ error: { message: HINDI_PRIVATE, code: 100, error_subcode: 2534025 } });
    assert.equal(r.kind, 'private_reply_invalid');
    assert.match(r.message, /private reply can't be sent/);
    assert.ok(!nonLatin.test(r.message));
  });

  it('an UNKNOWN code with a non-English message never leaks that message', () => {
    const r = describeMetaError({ error: { message: 'これは日本語です', code: 999999 } }, { channel: 'facebook' });
    assert.equal(r.kind, 'unknown');
    assert.equal(r.message, 'Facebook rejected this request (Meta code 999999)');
  });

  it('an unknown code with an English message keeps Meta\'s English text', () => {
    assert.equal(metaErrorText({ error: { message: 'Something odd happened', code: 12345 } }), 'Something odd happened (Meta code 12345)');
  });

  it('the same code gives the same English text regardless of Meta\'s language', () => {
    const en = metaErrorText({ error: { message: 'Invalid OAuth access token', code: 190 } });
    const hi = metaErrorText({ error: { message: 'अमान्य एक्सेस टोकन', code: 190 } });
    assert.equal(en, hi);
  });

  it('subcode-specific rules win over the generic code (24h window vs plain permission)', () => {
    assert.equal(describeMetaError({ error: { code: 10, error_subcode: 2534022 } }).kind, 'window_closed');
    assert.equal(describeMetaError({ error: { code: 10 } }).kind, 'permission');
    assert.equal(describeMetaError({ error: { code: 100, error_subcode: 33 } }).kind, 'not_found');
  });

  it('rate-limit and temporary codes are marked retryable', () => {
    for (const code of [4, 17, 32, 613, 1, 2]) assert.equal(describeMetaError({ error: { code } }).retry, true, `code ${code}`);
    assert.equal(describeMetaError({ error: { code: 190 } }).retry, false);
  });

  it('channel name is used in the wording', () => {
    assert.match(metaErrorText({ error: { code: 190 } }, { channel: 'facebook' }), /Your Facebook connection/);
  });

  it('with no error object at all, uses the caller\'s fallback', () => {
    assert.equal(metaErrorText({}, { fallback: 'Instagram send failed' }), 'Instagram send failed');
    assert.equal(metaErrorText(undefined, { fallback: 'x' }), 'x');
  });

  it('end to end: a Hindi Meta response through sendInstagramMessage reaches the caller in English', async () => {
    const { sendInstagramMessage } = await import('../lib/instagram/send.js');
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }) });
    const r = await sendInstagramMessage(igBusiness([]), 'U1', 'hello');
    assert.equal(r.success, false);
    assert.ok(!nonLatin.test(r.error));
    assert.match(r.error, /Instagram has temporarily limited messaging/);
  });

  it('end to end: same for Messenger and private replies', async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }) });
    const fb = await fbSend.sendMessengerMessage(fbBusiness([]), 'PSID', 'hi');
    assert.match(fb.error, /Facebook has temporarily limited messaging/);
    const { sendInstagramPrivateReply } = await import('../lib/instagram/send.js');
    const ig = await sendInstagramPrivateReply(igBusiness([]), 'C1', 'hi');
    assert.ok(!nonLatin.test(ig.error));
  });
});

// ───────────────────────── Send safety: warm-up, block cool-off, alerts ─────────────────────────
describe('Send safety (warm-up limits, block cool-off, alerts)', () => {
  let ss, guarded, User, Notification;
  const real = {};
  let created = [];
  let userQueries = [];
  const DAY = 86400000;
  const NOW = new Date('2026-09-19T12:00:00Z');
  const B = { _id: 'b1' };
  const blockedResult = { success: false, kind: 'action_blocked', code: 368, subcode: 1404169, error: 'blocked' };
  const HINDI_BLOCK = 'इस फ़ीचर के पिछले उपयोग के आधार पर, आपके अकाउंट को कुछ समय तक यह एक्शन करने से ब्लॉक किया गया है।';

  before(async () => {
    ss = await import('../lib/social/sendSafety.js');
    guarded = await import('../lib/social/guardedSend.js');
    User = (await import('../models/User.js')).default;
    Notification = (await import('../models/automation/Notification.js')).default;
    real.find = User.find;
    real.create = Notification.create;
  });
  after(() => { User.find = real.find; Notification.create = real.create; });
  beforeEach(() => {
    created = [];
    userQueries = [];
    User.find = (q) => { userQueries.push(q); return { select: () => ({ lean: async () => [{ _id: 'u1' }, { _id: 'u2' }] }) }; };
    Notification.create = async (doc) => { created.push(doc); return { _id: `n${created.length}`, ...doc }; };
  });

  // ── warm-up tiers ──
  it('starts at the lowest tier and ramps up with the age of the automation', () => {
    assert.equal(ss.tierFor(undefined, NOW).tier.fromDay, 0);
    assert.equal(ss.tierFor(new Date(NOW - 2 * DAY), NOW).tier.fromDay, 0);
    assert.equal(ss.tierFor(new Date(NOW - 3 * DAY), NOW).tier.fromDay, 3);
    assert.equal(ss.tierFor(new Date(NOW - 8 * DAY), NOW).tier.fromDay, 7);
    assert.equal(ss.tierFor(new Date(NOW - 30 * DAY), NOW).tier.fromDay, 14);
  });

  it('a start time in the future (warm-up restarted after a block) counts as day 0', () => {
    assert.equal(ss.tierFor(new Date(+NOW + 2 * DAY), NOW).ageDays, 0);
  });

  it('day-0 caps are small; the multiplier scales them but never below 1', () => {
    assert.deepEqual([ss.capsFor(null, 'dm', NOW).hour, ss.capsFor(null, 'dm', NOW).day], [5, 30]);
    assert.deepEqual([ss.capsFor(null, 'reply', NOW).hour, ss.capsFor(null, 'reply', NOW).day], [10, 60]);
    assert.equal(ss.capsFor({ limitMultiplier: 2 }, 'dm', NOW).hour, 10);
    assert.equal(ss.capsFor({ limitMultiplier: 0.1 }, 'dm', NOW).hour, 1);
  });

  it('even a mature account stays far below the old 600/hour cap', () => {
    const top = ss.TIERS[ss.TIERS.length - 1];
    assert.ok(top.dm.hour < 100 && top.reply.hour < 200);
  });

  // ── allowAutomatedSend ──
  it('allows a send on a fresh account, counting day then hour, and stamps the start time', async () => {
    const r = await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW);
    assert.equal(r.allowed, true);
    assert.equal(counterCalls.length, 2);
    assert.deepEqual([counterCalls[0].filter.window, counterCalls[0].filter.key, counterCalls[0].filter.count.$lt], ['d', '2026-09-19', 30]);
    assert.deepEqual([counterCalls[1].filter.window, counterCalls[1].filter.key, counterCalls[1].filter.count.$lt], ['h', '2026-09-19T12', 5]);
    assert.ok(safetyWrites.some((w) => w.update.$setOnInsert?.automationStartedAt));
  });

  it('holds a send back when the hourly cap is full (duplicate-key from the atomic counter) and counts it', async () => {
    // the day counter has room, but every hour-window counter is already full
    SendCounter.updateOne = async (filter) => { if (filter.window === 'h') { const e = new Error('dup'); e.code = 11000; throw e; } return {}; };
    const r = await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW);
    assert.equal(r.allowed, false);
    assert.equal(r.reason, 'hourly');
    assert.match(r.message, /5 per hour/);
    assert.equal(safetyState.throttled.count, 1);
    await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW);
    assert.equal(safetyState.throttled.count, 2);
  });

  it('a full daily cap is checked first, so the hour counter is not consumed', async () => {
    SendCounter.updateOne = async () => { const e = new Error('dup'); e.code = 11000; throw e; };
    const r = await ss.allowAutomatedSend(B, 'facebook', 'reply', NOW);
    assert.equal(r.reason, 'daily');
    assert.match(r.message, /60 per day/);
  });

  it('public replies and DMs are limited separately', async () => {
    await ss.allowAutomatedSend(B, 'instagram', 'reply', NOW);
    assert.equal(counterCalls[0].filter.kind, 'reply');
    assert.equal(counterCalls[0].filter.count.$lt, 60);
  });

  it('a later-stage account gets the higher cap', async () => {
    safetyState = { automationStartedAt: new Date(NOW - 8 * DAY) };
    await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW);
    assert.equal(counterCalls[1].filter.count.$lt, 30);
  });

  it('while blocked, nothing is counted and nothing is allowed', async () => {
    safetyState = { blockedUntil: new Date(+NOW + 3600000) };
    const r = await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW);
    assert.equal(r.allowed, false);
    assert.equal(r.reason, 'blocked');
    assert.equal(counterCalls.length, 0);
  });

  it('once the block has expired, sending is allowed again', async () => {
    safetyState = { blockedUntil: new Date(+NOW - 1000) };
    assert.equal((await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW)).allowed, true);
  });

  it('fails OPEN if the database errors (a safety feature must not break normal replies)', async () => {
    SendCounter.updateOne = async () => { throw new Error('mongo down'); };
    assert.equal((await ss.allowAutomatedSend(B, 'instagram', 'dm', NOW)).allowed, true);
  });

  // ── recordSendResult: block → pause + alert ──
  it('a platform block (368) pauses automation for 48h, restarts the warm-up, and alerts owners/admins only', async () => {
    await ss.recordSendResult(B, 'instagram', blockedResult, NOW);
    const set = safetyWrites[0].update.$set;
    assert.equal(+set.blockedUntil, +NOW + 48 * 3600000);
    assert.equal(+set.automationStartedAt, +set.blockedUntil, 'warm-up restarts when the block ends');
    assert.equal(set.lastIssue.kind, 'action_blocked');
    assert.equal(created.length, 2);
    assert.equal(created[0].type, 'automation_alert');
    assert.match(created[0].title, /Instagram paused automated messages/);
    const roles = userQueries[0].role.$in;
    assert.ok(roles.includes('owner') && roles.includes('admin'));
    assert.ok(!roles.includes('team_member') && !roles.includes('VIEW_ONLY'));
  });

  it('a second block report during the pause neither extends it nor re-alerts', async () => {
    await ss.recordSendResult(B, 'instagram', blockedResult, NOW);
    const writes = safetyWrites.length;
    await ss.recordSendResult(B, 'instagram', blockedResult, new Date(+NOW + 3600000));
    assert.equal(safetyWrites.length, writes);
    assert.equal(created.length, 2);
  });

  it('after the pause ends, a new block starts a new pause', async () => {
    await ss.recordSendResult(B, 'instagram', blockedResult, NOW);
    await ss.recordSendResult(B, 'instagram', blockedResult, new Date(+NOW + 49 * 3600000));
    assert.equal(created.length, 4);
  });

  it('an expired token is recorded and alerted at most once per 24h', async () => {
    const expired = { success: false, kind: 'token_expired', code: 190, error: 'expired' };
    await ss.recordSendResult(B, 'facebook', expired, NOW);
    assert.equal(safetyState.lastIssue.kind, 'token_expired');
    assert.equal(created.length, 2);
    assert.match(created[0].title, /Facebook needs to be reconnected/);
    await ss.recordSendResult(B, 'facebook', expired, new Date(+NOW + 2 * 3600000));
    assert.equal(created.length, 2, 'no repeat alert within 24h');
    await ss.recordSendResult(B, 'facebook', expired, new Date(+NOW + 25 * 3600000));
    assert.equal(created.length, 4, 'alerts again after 24h');
  });

  it('successes and unrelated failures (rate limit, unknown, held back) change nothing', async () => {
    for (const r of [{ success: true }, { success: false, kind: 'rate_limited' }, { success: false, kind: 'unknown' }, { success: false, kind: 'throttled' }, { success: false }]) {
      await ss.recordSendResult(B, 'instagram', r, NOW);
    }
    assert.equal(safetyWrites.length, 0);
    assert.equal(created.length, 0);
  });

  it('never throws, even when notifying fails', async () => {
    User.find = () => { throw new Error('db down'); };
    await assert.doesNotReject(ss.recordSendResult(B, 'instagram', blockedResult, NOW));
    assert.ok(safetyState.blockedUntil, 'the pause still took effect');
  });

  // ── summary for the UI ──
  it('summarises status for the settings page', async () => {
    let s = await ss.getSafetySummary('b1', 'instagram', NOW);
    assert.deepEqual([s.blocked, s.warmupDay, s.limits.dm.hour, s.heldBackToday], [false, 1, 5, 0]);
    safetyState = { blockedUntil: new Date(+NOW + DAY), throttled: { day: '2026-09-19', count: 4 }, lastIssue: { kind: 'action_blocked', message: 'm', at: NOW } };
    s = await ss.getSafetySummary('b1', 'instagram', NOW);
    assert.deepEqual([s.blocked, s.heldBackToday, s.issue.kind], [true, 4, 'action_blocked']);
  });

  // ── guarded senders ──
  it('a guarded send is held back (and never reaches Meta) while blocked', async () => {
    safetyState = { blockedUntil: new Date(Date.now() + 3600000) };
    const r = await guarded.sendInstagramMessage(igBusiness([]), 'U1', 'hi');
    assert.deepEqual([r.success, r.kind, r.skipped], [false, 'throttled', true]);
    assert.equal(fetchCalls.length, 0);
  });

  it('a guarded send passes straight through when allowed', async () => {
    const r = await guarded.sendInstagramMessage(igBusiness([]), 'U1', 'hi');
    assert.equal(r.success, true);
    assert.equal(fetchCalls.length, 1);
  });

  it('a live Meta block seen by a guarded send pauses everything after it', async () => {
    globalThis.fetch = async (url, opts) => { fetchCalls.push({ url: String(url), body: JSON.parse(opts.body) }); return { ok: false, json: async () => ({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }) }; };
    const first = await guarded.sendInstagramMessage(igBusiness([]), 'U1', 'hi');
    assert.equal(first.kind, 'action_blocked');
    assert.ok(safetyState.blockedUntil > new Date());
    const second = await guarded.sendInstagramCommentReply(igBusiness([]), 'C1', 'thanks');
    assert.equal(second.skipped, true);
    assert.equal(fetchCalls.length, 1, 'the second send never went to Meta');
  });

  it('failed plain sends expose kind/code/subcode for the manual inbox path', async () => {
    const { sendInstagramMessage } = await import('../lib/instagram/send.js');
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }) });
    const r = await sendInstagramMessage(igBusiness([]), 'U1', 'hi');
    assert.deepEqual([r.kind, r.code, r.subcode, r.retry], ['action_blocked', 368, 1404169, true]);
  });

  // ── comment automation under a block ──
  it('comment automation sends nothing while the account is blocked', async () => {
    safetyState = { blockedUntil: new Date(Date.now() + 3600000) };
    currentBusiness = igBusiness([rule({ publicReply: 'thanks', dmMessage: 'dm' })]);
    await igAuto.runCommentAutomations('biz1', { commentId: 'IC1', mediaId: 'M', commenterId: 'U1', text: 'price' });
    assert.equal(fetchCalls.length, 0);
  });

  it('a block discovered on the private reply stops the fallback DM too (one call, not two)', async () => {
    globalThis.fetch = async (url, opts) => { fetchCalls.push({ url: String(url), body: JSON.parse(opts.body) }); return { ok: false, json: async () => ({ error: { message: HINDI_BLOCK, code: 368, error_subcode: 1404169 } }) }; };
    currentBusiness = igBusiness([rule({ dmMessage: 'dm' })]);
    await igAuto.runCommentAutomations('biz1', { commentId: 'IC1', mediaId: 'M', commenterId: 'U1', text: 'price' });
    assert.equal(fetchCalls.length, 1);
    assert.deepEqual(fetchCalls[0].body.recipient, { comment_id: 'IC1' });
    assert.ok(safetyState.blockedUntil);
  });
});

