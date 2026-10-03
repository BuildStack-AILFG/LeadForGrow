/**
 * WhatsApp opt-out: nobody who replied STOP gets automated or template messages.
 *
 * Run: node --test tests/whatsapp-opt-out.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { optOutDecision, isStopKeyword, isStartKeyword, OPTED_OUT_MESSAGE } from '../lib/whatsapp/optOutRules.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('who may be messaged', () => {
  it('anyone who did not opt out', () => {
    assert.equal(optOutDecision({ optedOut: false, origin: 'automation', isTemplate: true }), true);
  });

  it('opted out: no automations, sequences, broadcasts, templates', () => {
    for (const origin of ['automation', 'sequence', 'broadcast', 'meeting', 'system']) {
      assert.equal(optOutDecision({ optedOut: true, origin }), false, origin);
    }
    assert.equal(optOutDecision({ optedOut: true, origin: 'user', isTemplate: true, reengaged: true }), false, 'templates are business-started');
  });

  it('opted out: an agent may answer only after the customer wrote again', () => {
    assert.equal(optOutDecision({ optedOut: true, origin: 'user', reengaged: false }), false);
    assert.equal(optOutDecision({ optedOut: true, origin: 'user', reengaged: true }), true);
  });

  it('keywords are standalone only, English and Hinglish', () => {
    for (const w of ['STOP', 'stop.', 'Unsubscribe', 'opt out', 'opt-out', 'band karo', 'roko']) assert.equal(isStopKeyword(w), true, w);
    for (const w of ['stop the sale', 'please stop by tomorrow', '', null]) assert.equal(isStopKeyword(w), false, String(w));
    for (const w of ['START', 'unstop', 'subscribe', 'opt in', 'chalu karo']) assert.equal(isStartKeyword(w), true, w);
    assert.equal(isStartKeyword('start date?'), false);
    assert.match(OPTED_OUT_MESSAGE, /START/);
  });
});

describe('every WhatsApp send goes through the check', () => {
  it('text and template sends', () => {
    const src = read('lib/integrations/whatsapp.js');
    assert.match(src, /const blocked = await whatsappOptOutBlock\(lead, business\._id, \{ origin: sendOptions\.origin \|\| 'automation', isTemplate: Boolean\(templateName\) \}\);/);
    assert.ok(src.indexOf('whatsappOptOutBlock(lead') < src.indexOf("provider === 'interakt'"), 'checked before sending');
  });

  it('media and interactive (flows) sends', () => {
    assert.match(read('lib/integrations/whatsappMedia.js'), /await assertWhatsAppAllowed\(lead, business, \{ origin \}\);/);
    const interactive = read('lib/integrations/whatsappInteractive.js');
    assert.equal((interactive.match(/await assertWhatsAppAllowed\(lead, business\)/g) || []).length, 2);
  });

  it('the inbox marks its media as an agent send and answers 403 with the reason', () => {
    const inbox = read('app/api/automation/inbox/send/route.js');
    assert.match(inbox, /origin: 'user', \/\/ an agent attached this/);
    assert.match(inbox, /result\.reason === 'opted_out' \? 403 : 500/);
    assert.match(inbox, /error\.code === 'OPTED_OUT' \? 403 : 500/);
    for (const p of ['app/api/automation/whatsapp/send/route.js', 'app/api/automation/chat/send/route.js']) {
      assert.match(read(p), /result\.reason === 'opted_out' \? 403 : 500/, p);
    }
  });

  it('STOP and START use the shared keywords; both are real activity types', () => {
    const lm = read('lib/automation/leadManager.js');
    assert.match(lm, /isStopKeyword\(body\)/);
    assert.match(lm, /if \(isStartKeyword\(body\)\)/);
    assert.match(lm, /\$set: \{ optedOutOfWhatsApp: false \}/);
    const activity = read('models/automation/Activity.js');
    assert.match(activity, /'whatsapp_opted_out'/, 'the STOP timeline entry used to fail validation silently');
    assert.match(activity, /'whatsapp_opted_in'/);
  });
});
