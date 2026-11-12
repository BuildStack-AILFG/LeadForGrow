/**
 * Instagram automations: DM auto-reply rules, "any comment" matching, builder wiring.
 * Run: node --test tests/instagram-automations.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import fs from 'node:fs';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

let D, CM, CR, React, renderToStaticMarkup, Phone;
before(async () => {
  D = await import('../lib/automation/dmRules.js');
  CM = await import('../lib/automation/commentMatch.js');
  CR = await import('../lib/automation/commentRules.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Phone } = await import('../app/automation/components/instagram/PhonePreview.jsx'));
});

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('DM auto-reply rules', () => {
  it('validates: keywords needed for keyword rules, message needed for fixed replies', () => {
    assert.match(D.sanitizeDmRule({ trigger: 'keyword', keywords: [], message: 'hi' }).error, /keyword/);
    assert.match(D.sanitizeDmRule({ trigger: 'any', replyMode: 'static', message: ' ' }).error, /reply message/);
    const { rule } = D.sanitizeDmRule({ trigger: 'any', replyMode: 'ai', cooldownMinutes: 5 });
    assert.equal(rule.cooldownMinutes, 15); // clamped
    assert.match(rule.id, /^dmr_/);
  });

  it('keeps id, count and createdAt when editing; dedupes keywords', () => {
    const prev = { id: 'dmr_x', triggeredCount: 7, createdAt: new Date('2026-01-01') };
    const { rule } = D.sanitizeDmRule({ trigger: 'keyword', keywords: ['Price', 'price', ' '], message: 'ok' }, prev);
    assert.equal(rule.id, 'dmr_x');
    assert.equal(rule.triggeredCount, 7);
    assert.deepEqual(rule.keywords, ['Price', 'price']); // case kept, exact dupes removed
  });

  it('keyword rules win over "any message"; whole-word matching', () => {
    const rules = [
      { id: 'any', trigger: 'any', enabled: true, cooldownMinutes: 60 },
      { id: 'kw', trigger: 'keyword', keywords: ['price'], matchType: 'contains', enabled: true },
    ];
    assert.equal(D.findDmRule(rules, 'what is the PRICE?').id, 'kw');
    assert.equal(D.findDmRule(rules, 'pricey stuff').id, 'any');
    assert.equal(D.findDmRule([{ ...rules[1], matchType: 'exact' }], 'price please'), null);
  });

  it('"any message" rule respects its per-conversation cool-down; disabled rules never fire', () => {
    const now = new Date('2026-11-12T10:00:00Z');
    const rules = [{ id: 'any', trigger: 'any', enabled: true, cooldownMinutes: 60 }];
    assert.equal(D.findDmRule(rules, 'hi', { now, lastRepliedAt: () => new Date('2026-11-12T09:30:00Z') }), null);
    assert.equal(D.findDmRule(rules, 'hi', { now, lastRepliedAt: () => new Date('2026-11-12T08:30:00Z') }).id, 'any');
    assert.equal(D.findDmRule([{ ...rules[0], enabled: false }], 'hi'), null);
  });
});

describe('comment rules: "any comment"', () => {
  it('matches every non-empty comment and survives sanitising', () => {
    assert.equal(CM.textMatches('love it', { matchType: 'any', keywords: [] }), true);
    assert.equal(CM.textMatches('   ', { matchType: 'any' }), false);
    const [r] = CR.sanitizeCommentRules([{ matchType: 'any', keywords: [], scope: 'all', dmMessage: 'hi' }]);
    assert.equal(r.matchType, 'any');
  });
});

describe('phone preview', () => {
  const account = { username: 'acme', profilePicture: '', aiReplyEnabled: false };
  it('comment tab shows the keyword comment and the first public-reply variation', () => {
    const html = renderToStaticMarkup(React.createElement(Phone, {
      kind: 'comment', account, tab: 'comments',
      rule: { keywords: ['price'], publicReplyOn: true, publicReply: 'Check DMs! ||| Sent!', scope: 'all' },
    }));
    assert.match(html, />price</);
    assert.match(html, />Check DMs!</);
    assert.doesNotMatch(html, /Sent!/);
  });
  it('DM tab shows the fixed DM, or an AI placeholder in AI mode', () => {
    const fixed = renderToStaticMarkup(React.createElement(Phone, { kind: 'dm', account, rule: { trigger: 'keyword', keywords: ['hi'], replyMode: 'static', message: 'Hello {there|friend}!' } }));
    assert.match(fixed, /Hello there!/);
    const ai = renderToStaticMarkup(React.createElement(Phone, { kind: 'dm', account, rule: { trigger: 'any', replyMode: 'ai', message: '' } }));
    assert.match(ai, /AI reply/);
  });
});

describe('wiring', () => {
  it('sidebar links the new page under Automation', () => {
    assert.match(read('app/automation/components/layout/constants.js'), /href: '\/automation\/instagram-automation', icon: Instagram/);
  });
  it('the DM webhook runs auto-replies only when no flow handled the message', () => {
    const src = read('lib/instagram/handler.js');
    assert.match(src, /if \(!resumed\?\.length && !started\?\.length\)/);
    assert.match(src, /runInstagramDmAutomations/);
  });
  it('auto-replies skip taken-over chats and are recorded as automation', () => {
    const src = read('lib/instagram/dmAutomation.js');
    assert.match(src, /inboxStatus === 'intervened'/);
    assert.match(src, /origin: 'automation'/);
    assert.match(src, /from '@\/lib\/social\/guardedSend'/);
  });
});
