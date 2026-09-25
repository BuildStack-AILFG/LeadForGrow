/**
 * First-response tracking (Leak Guard, Phase 0).
 *
 * Rules: lib/omnichannel/responseTracking.js. Wiring: recordChannelMessage,
 * WhatsApp sender origin, IMAP bulk headers, SLA auto-reply guardrail.
 *
 * Run: node --test tests/response-tracking.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  pickBulkHeaders,
  isBulkMail,
  isCustomerInbound,
  responseTrackingOps,
  firstReplyUpdate,
} from '../lib/omnichannel/responseTracking.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const t = new Date('2026-09-25T10:00:00Z');

describe('bulk mail detection', () => {
  it('keeps only the bulk headers, trimmed and capped', () => {
    const h = pickBulkHeaders([
      { key: 'from', line: 'From: a@b.com' },
      { key: 'list-unsubscribe', line: 'List-Unsubscribe: <mailto:u@x.com>,\r\n <https://x.com/u>' },
      { key: 'precedence', line: 'Precedence: bulk' },
      { key: 'x-long', line: 'X-Long: ' + 'a'.repeat(999) },
      { key: 'auto-submitted', line: 'Auto-Submitted: ' + 'b'.repeat(999) },
    ]);
    assert.deepEqual(Object.keys(h).sort(), ['auto-submitted', 'list-unsubscribe', 'precedence']);
    assert.equal(h['list-unsubscribe'], '<mailto:u@x.com>, <https://x.com/u>');
    assert.equal(h['auto-submitted'].length, 300);
    assert.equal(pickBulkHeaders([{ key: 'from', line: 'From: a@b.com' }]), undefined);
    assert.equal(pickBulkHeaders(undefined), undefined);
  });

  it('recognises bulk and auto-generated mail, from a plain object or a Map', () => {
    assert.equal(isBulkMail({ 'list-unsubscribe': '<mailto:u@x.com>' }), true);
    assert.equal(isBulkMail(new Map([['precedence', 'Bulk']])), true);
    assert.equal(isBulkMail({ 'auto-submitted': 'auto-replied' }), true);
    assert.equal(isBulkMail({ 'auto-submitted': 'no' }), false, 'RFC 3834: "no" means a person sent it');
    assert.equal(isBulkMail({ precedence: 'first-class' }), false);
    assert.equal(isBulkMail(undefined), false);
  });

  it('only real customers start the clock', () => {
    assert.equal(isCustomerInbound({ channel: 'email', participantEmail: 'ravi@acme.in' }), true);
    assert.equal(isCustomerInbound({ channel: 'email', participantEmail: 'no-reply@acme.in' }), false);
    assert.equal(isCustomerInbound({ channel: 'email', participantEmail: 'ravi@acme.in', headers: { 'list-id': 'x' } }), false);
    assert.equal(isCustomerInbound({ channel: 'whatsapp' }), true);
    assert.equal(isCustomerInbound({ channel: 'whatsapp', isInternal: true }), false);
  });
});

describe('operators merged into the existing Conversation write', () => {
  it('customer message: $min sets first-inbound and waiting-since only when earlier/missing', () => {
    assert.deepEqual(
      responseTrackingOps({ direction: 'incoming', customerInbound: true, timestamp: t }),
      { $min: { firstInboundAt: t, awaitingReplySince: t } }
    );
  });

  it('machine mail and internal notes change nothing', () => {
    assert.deepEqual(responseTrackingOps({ direction: 'incoming', customerInbound: false, timestamp: t }), {});
    assert.deepEqual(responseTrackingOps({ direction: 'outgoing', origin: 'user', isInternal: true, timestamp: t }), {});
  });

  it('a human reply clears waiting; automated or failed sends do not', () => {
    assert.deepEqual(responseTrackingOps({ direction: 'outgoing', origin: 'user', status: 'sent', timestamp: t }), { $unset: { awaitingReplySince: 1 } });
    for (const origin of ['automation', 'sequence', 'broadcast', 'meeting', 'system']) {
      assert.deepEqual(responseTrackingOps({ direction: 'outgoing', origin, status: 'sent', timestamp: t }), {}, origin);
    }
    for (const status of ['failed', 'draft', 'scheduled']) {
      assert.deepEqual(responseTrackingOps({ direction: 'outgoing', origin: 'user', status, timestamp: t }), {}, status);
    }
  });
});

describe('one-time first-reply stamp', () => {
  const conversation = { _id: 'c1', firstInboundAt: new Date('2026-09-25T09:00:00Z') };

  it('first human reply: conditional on the customer having written first', () => {
    const u = firstReplyUpdate({ direction: 'outgoing', origin: 'user', status: 'sent', timestamp: t, conversation });
    assert.deepEqual(u.filter, { _id: 'c1', firstInboundAt: { $lte: t }, firstResponseAt: { $exists: false } });
    assert.deepEqual(u.update, [{ $set: { firstResponseAt: t, firstResponseMs: { $subtract: [t, '$firstInboundAt'] }, responseConfidence: 'live' } }]);
  });

  it('first automation/sequence reply is stamped separately; broadcasts are not replies', () => {
    const u = firstReplyUpdate({ direction: 'outgoing', origin: 'sequence', status: 'sent', timestamp: t, conversation });
    assert.deepEqual(u.update, { $set: { firstAutoResponseAt: t } });
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'broadcast', status: 'sent', timestamp: t, conversation }), null);
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'meeting', status: 'sent', timestamp: t, conversation }), null);
  });

  it('no extra write once the value is known, or for inbound/failed/internal', () => {
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'user', status: 'sent', timestamp: t, conversation: { ...conversation, firstResponseAt: t } }), null);
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'automation', status: 'sent', timestamp: t, conversation: { ...conversation, firstAutoResponseAt: t } }), null);
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'user', status: 'sent', timestamp: t, conversation: { _id: 'c1' } }), null, 'customer never wrote');
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'sequence', status: 'sent', timestamp: t, conversation: { _id: 'c1' } }), null, 'cold sequence');
    assert.equal(firstReplyUpdate({ direction: 'incoming', origin: 'user', timestamp: t, conversation }), null);
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'user', status: 'failed', timestamp: t, conversation }), null);
    assert.equal(firstReplyUpdate({ direction: 'outgoing', origin: 'user', isInternal: true, timestamp: t, conversation }), null);
  });
});

describe('wiring', () => {
  it('recordChannelMessage merges the ops into both Conversation writes and stamps the first reply', () => {
    const src = read('lib/omnichannel/conversationService.js');
    assert.match(src, /\.\.\.\(incrementUnread \? \{ \$inc: inc \} : \{\}\),\s*\.\.\.trackingOps,/, 'upsert path');
    assert.match(src, /\$inc: \{ unreadCount: 1 \} \} : \{\}\),\s*\.\.\.trackingOps,/, 'existing-conversation path');
    assert.match(src, /Conversation\.updateOne\(firstReply\.filter, firstReply\.update, \{ updatePipeline: true \}\)/);
  });

  it('Conversation has the fields and a partial index for "who is waiting"', () => {
    const src = read('models/omnichannel/Conversation.js');
    for (const f of ['firstInboundAt', 'firstResponseAt', 'firstResponseMs', 'firstAutoResponseAt', 'awaitingReplySince', 'responseConfidence']) {
      assert.match(src, new RegExp(`${f}: \\{ type:`), f);
    }
    assert.match(src, /\{ businessId: 1, awaitingReplySince: 1 \},\s*\{ partialFilterExpression: \{ awaitingReplySince: \{ \$type: 'date' \} \} \}/);
  });

  it('WhatsApp sends carry who sent them; automated is the default', () => {
    const wa = read('lib/integrations/whatsapp.js');
    assert.match(wa, /recordOutgoingMessage\(leadId, businessId, text, externalId, templateName = null, extraMetadata = null, origin = 'automation'\)/);
    assert.match(wa, /origin: safeOrigin,/);
    for (const p of ['app/api/automation/inbox/send/route.js', 'app/api/automation/chat/send/route.js', 'app/api/automation/whatsapp/send/route.js']) {
      assert.match(read(p), /\{ origin: 'user' \}/, `${p} is an agent send`);
    }
    assert.equal((read('lib/broadcasts/engine.js').match(/sendAutoWhatsApp\([^;]*?\{ origin: 'broadcast' \}/g) || []).length, 2);
    assert.equal((read('lib/sequences/executor.js').match(/sendAutoWhatsApp\([^;]*?\{ origin: 'sequence' \}/g) || []).length, 3);
    assert.match(read('lib/meetings/reminders.js'), /\{ origin: 'meeting' \}/);
  });

  it('IMAP sync stores the bulk headers on inbound mail', () => {
    const src = read('lib/omnichannel/emailSync.js');
    assert.match(src, /const bulkHeaders = pickBulkHeaders\(parsed\.headerLines\)/);
    assert.match(src, /headers: bulkHeaders,/);
  });

  it('SLA auto-reply never answers machine mail', () => {
    const src = read('lib/emailAutoReply.js');
    assert.match(src, /reason: 'automated_sender'/);
    assert.ok(src.indexOf("reason: 'automated_sender'") < src.indexOf('const humanReply'), 'checked before the extra query');
  });
});
