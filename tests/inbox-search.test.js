/**
 * Inbox search finds ANY lead (by name, email or a number in any format), and clicking one that has never messaged
 * starts a new WhatsApp chat (approved template) instead of doing nothing.
 * Run: node --test tests/inbox-search.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let Q, R;
before(async () => {
  Q = await import('../lib/omnichannel/searchQuery.js');
  R = await import('../lib/omnichannel/searchRows.js');
});

describe('phone-like queries', () => {
  it('recognises numbers in any common format, not names', () => {
    for (const s of ['9986030563', '99860 30563', '+91 99860-30563', '(415) 555-2671', '998']) assert.equal(Q.looksLikePhone(s), true, s);
    for (const s of ['Preeti', 'preeti2', 'ab', '12', '', null]) assert.equal(Q.looksLikePhone(s), false, String(s));
  });

  it('the regex finds the digits however the stored number is formatted', () => {
    const re = new RegExp(Q.phoneSearchRegex('99860 30563'));
    for (const stored of ['9986030563', '919986030563', '+91 99860 30563', '99860-30563', '+91-99860-30563']) {
      assert.ok(re.test(stored), stored);
    }
    assert.ok(!re.test('9986130563'));
    assert.ok(!re.test('919811039250'));
  });

  it('a number typed WITH a country code still finds a lead stored as the bare 10 digits (and the reverse)', () => {
    const res = Q.phoneSearchRegexes('+91 99860-30563').map((r) => new RegExp(r));
    assert.equal(res.length, 2);
    assert.ok(res.some((re) => re.test('9986030563')), 'bare 10 digits');
    assert.ok(res.some((re) => re.test('919986030563')), 'stored with 91');
    const bare = Q.phoneSearchRegexes('9986030563').map((r) => new RegExp(r));
    assert.equal(bare.length, 1);
    assert.ok(bare[0].test('+91 99860 30563'));
    assert.deepEqual(Q.phoneSearchRegexes('Preeti'), []);
  });

  it('a partial number matches too, and a name query builds no phone regex', () => {
    assert.ok(new RegExp(Q.phoneSearchRegex('60305')).test('+91 99860 30563'));
    assert.equal(Q.phoneSearchRegex('Preeti'), null);
    assert.equal(Q.phoneSearchRegex('1'.repeat(20)), null, 'too long to be a phone number');
  });

  it('lead clauses cover name, email, phone and WhatsApp number, plus the tolerant phone match for numbers', () => {
    const byName = Q.leadSearchClauses('Preeti', 'Preeti');
    assert.deepEqual(byName.map((c) => Object.keys(c)[0]), ['name', 'email', 'phone', 'whatsapp']);
    const byNumber = Q.leadSearchClauses('9986030563', '9986030563');
    assert.ok(byNumber.length > byName.length);
    assert.ok(byNumber.some((c) => c.whatsappId), 'a number stored only as whatsappId is found');
  });
});

describe('which conversation to open for a lead', () => {
  it('prefers WhatsApp (that is what "message her" means), else the latest one', () => {
    const wa = { _id: 'w', channel: 'whatsapp', lastMessageAt: '2026-09-01' };
    const ig = { _id: 'i', channel: 'instagram', lastMessageAt: '2026-09-20' };
    assert.equal(Q.pickConversationForLead([ig, wa])._id, 'w');
    assert.equal(Q.pickConversationForLead([ig])._id, 'i');
    assert.equal(Q.pickConversationForLead([]), null);
  });
});

describe('dropdown rows', () => {
  const conv = { _id: 'c1', participantName: 'Riya Singh', participantPhone: '919811100000', leadId: 'l1' };
  const results = {
    conversations: [conv],
    leads: [
      { _id: 'l1', name: 'Riya Singh', phone: '919811100000', conversation: conv },
      { _id: 'l2', name: 'Preetiahuja', phone: '9986030563', conversation: null },
      { _id: 'l3', name: 'saif', email: 'a@b.com', conversation: { _id: 'other' } },
    ],
    messages: [{ _id: 'm1', content: { body: 'hello there' } }],
  };
  let rows;
  before(() => { rows = R.buildSearchRows(results); });

  it('lists conversations, then leads not already listed, then messages', () => {
    assert.deepEqual(rows.map((r) => `${r.type}:${r.item._id}`), ['conversation:c1', 'lead:l2', 'lead:l3', 'message:m1']);
  });

  it('marks a lead without a conversation as "new chat" and shows its number', () => {
    const l2 = rows.find((r) => r.item._id === 'l2');
    assert.equal(l2.hasChat, false);
    assert.equal(l2.sub, '9986030563');
    assert.equal(rows.find((r) => r.item._id === 'l3').hasChat, true);
  });

  it('copes with empty / missing results', () => {
    assert.deepEqual(R.buildSearchRows(null), []);
    assert.deepEqual(R.buildSearchRows({}), []);
  });
});

describe('wiring', () => {
  it('the search API uses the tolerant lead search and attaches the conversation to open', () => {
    const route = read('app/api/automation/inbox/search/route.js');
    assert.ok(route.includes('filters.leads') && route.includes('pickConversationForLead('));
    assert.ok(Q.buildSearchFilters({ businessId: 'b', rawQ: 'Preeti', escaped: 'Preeti' }).leads.$or.length === 4);
    assert.ok(route.includes("select('name phone email status source whatsapp whatsappId')"));
  });

  it('clicking a lead opens its chat, or the template picker, or explains why it cannot', () => {
    const page = read('app/automation/chat/page.js');
    assert.ok(page.includes('inbox.selectChat(makeNewChat(lead))'), 'a lead without a chat opens a NEW CHAT in the inbox layout');
    assert.ok(page.includes('has no phone number, so there is no WhatsApp chat to start'));
    assert.ok(!page.includes('SendTemplateModal'), 'no modal in the inbox any more');
  });

  it('the dropdown shows the number and a "Start new chat" hint', () => {
    const side = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.ok(side.includes('buildSearchRows(searchResults)') && side.includes('Start new chat'));
  });
});

describe('every search section is a valid query for its model (the route answered HTTP 500 to EVERY search before)', () => {
  const biz = '507f1f77bcf86cd799439011';
  const cases = [
    ['messages', '../models/automation/Message.js'],
    ['conversations', '../models/omnichannel/Conversation.js'],
    ['leads', '../models/automation/Lead.js'],
    ['contacts', '../models/automation/Contact.js'],
    ['companies', '../models/automation/Company.js'],
    ['deals', '../models/automation/Deal.js'],
  ];
  const inputs = ['Preeti', '99860 30563', '+91 99860-30563', 'a@b.com'];

  for (const [name, modelPath] of cases) {
    it(`${name}: casts for a name, a number and an email`, async () => {
      const { default: Model } = await import(modelPath);
      for (const raw of inputs) {
        const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const filter = Q.buildSearchFilters({ businessId: biz, rawQ: raw, escaped })[name];
        assert.doesNotThrow(() => Model.find(filter).cast(Model), `${name} filter for "${raw}"`);
      }
    });
  }

  it('the OLD contact filter (regex straight on the sub-document arrays) is rejected: the test catches the bug', async () => {
    const { default: Contact } = await import('../models/automation/Contact.js');
    const old = { businessId: biz, $or: [{ firstName: /x/i }, { emails: { $regex: 'x', $options: 'i' } }, { phones: { $regex: 'x', $options: 'i' } }] };
    assert.throws(() => Contact.find(old).cast(Contact), /Cast to embedded failed/);
  });

  it('the route uses these filters and isolates each section, so one failure never blanks the dropdown', () => {
    const route = read('app/api/automation/inbox/search/route.js');
    assert.ok(route.includes('buildSearchFilters({ businessId, rawQ, escaped: q })'));
    assert.ok(route.includes('async function section(name, fn)') && (route.match(/jobs\.push\(section\(/g) || []).length === 6);
    assert.ok(!/phones: regex|emails: regex/.test(route));
  });
});
