/**
 * Messaging a lead on WhatsApp who has never written to us: correct wa.me number, and an approved-template picker
 * instead of an Inbox that has no conversation to open.
 * Run: node --test tests/whatsapp-first-contact.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let W, React, renderToStaticMarkup, Modal;
before(async () => {
  W = await import('../lib/whatsapp/waPhone.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Modal } = await import('../app/automation/components/leads/SendTemplateModal.jsx'));
});

describe('toWhatsAppNumber', () => {
  it('adds 91 to a 10-digit Indian number (the reported 9986030563)', () => {
    assert.equal(W.toWhatsAppNumber('9986030563'), '919986030563');
    assert.equal(W.toWhatsAppNumber('99860 30563'), '919986030563');
  });
  it('leaves numbers that already carry a country code alone', () => {
    assert.equal(W.toWhatsAppNumber('919986030563'), '919986030563');
    assert.equal(W.toWhatsAppNumber('+91 99860-30563'), '919986030563');
    assert.equal(W.toWhatsAppNumber('+1 (415) 555-2671'), '14155552671');
  });
  it('is safe on empty input', () => {
    assert.equal(W.toWhatsAppNumber(''), '');
    assert.equal(W.toWhatsAppNumber(null), '');
    assert.equal(W.toWhatsAppNumber(undefined), '');
  });
});

describe('hasWhatsAppHistory', () => {
  it('only a lead that messaged us on WhatsApp has a conversation', () => {
    assert.equal(W.hasWhatsAppHistory({ source: 'whatsapp' }), true);
    assert.equal(W.hasWhatsAppHistory({ source: 'call', whatsappId: '919811039250' }), true);
    assert.equal(W.hasWhatsAppHistory({ source: 'call', phone: '9986030563' }), false, 'a call lead with a phone but no WhatsApp history');
    assert.equal(W.hasWhatsAppHistory({ source: 'instagram' }), false);
    assert.equal(W.hasWhatsAppHistory(null), false);
  });
});

describe('wa.me links use the shared number rule', () => {
  it('the lead page button, the share modal and the API path all go through toWhatsAppNumber', () => {
    assert.ok(read('app/automation/hooks/useLeadDetail.js').includes('toWhatsAppNumber(lead.phone)'));
    assert.ok(read('app/automation/components/leads/ShareLeadModal.jsx').includes('toWhatsAppNumber(contact.whatsapp)'));
    const api = read('lib/integrations/whatsapp.js');
    assert.ok(api.includes("toWhatsAppNumber(lead.whatsapp || lead.phone || '')"));
    assert.ok(!api.includes("length === 10) cleanPhone"), 'the inline copy of the rule is gone');
  });
});

describe('template picker for leads without a WhatsApp chat', () => {
  let html;
  before(() => {
    html = renderToStaticMarkup(React.createElement(Modal, { lead: { _id: 'l1', name: 'Preetiahuja', phone: '9986030563' }, onClose() {} }));
  });

  it('renders a dialog that explains only a template can start the chat', () => {
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('WhatsApp to Preetiahuja'));
    assert.ok(html.includes('First message on WhatsApp'));
    assert.ok(html.includes('to start a conversation.'));
    assert.ok(!html.includes('24-hour reply window closed'), 'not the in-chat wording');
  });

  it('sends through the Inbox send route with the lead id (the route creates the conversation)', () => {
    const src = read('app/automation/components/leads/SendTemplateModal.jsx');
    assert.ok(src.includes("'/api/automation/inbox/send'"));
    for (const f of ['leadId: lead._id', "channel: 'whatsapp'", 'templateName: template.name', 'templateLanguage:', 'templateVariables:']) {
      assert.ok(src.includes(f), f);
    }
    assert.ok(/if \(!res\.ok \|\| !data\.success\) throw/.test(src), 'a failed send surfaces as an error toast, never as success');
  });

  it('the drawer button and the table icon open it for phone leads without history, and keep the Inbox link otherwise', () => {
    const drawer = read('app/automation/components/leads/LeadDrawer.jsx');
    assert.ok(drawer.includes('lead.phone && !hasWhatsAppHistory(lead)') && drawer.includes('<SendTemplateModal'));
    assert.ok(drawer.includes('/automation/chat?leadId='), 'Inbox link kept for leads with a conversation');
    const row = read('app/automation/components/leads/LeadRow.jsx');
    assert.ok(row.includes('lead.phone && !hasWhatsAppHistory(lead) && onSendTemplate'));
    assert.ok(row.includes('<WhatsAppIcon colored'), 'real WhatsApp logo instead of a generic bubble');
    assert.ok(read('app/automation/components/leads/LeadTable.jsx').includes('onSendTemplate={onSendTemplate}'));
    assert.ok(read('app/automation/leads/page.js').includes('onSendTemplate={setTemplateLead}'));
  });

  it('the in-chat template bar keeps its wording unless asked for the first-contact variant', () => {
    const bar = read('app/automation/components/chat/OutOfWindowTemplateBar.jsx');
    assert.ok(bar.includes('24-hour reply window closed') && bar.includes('firstContact = false'));
  });
});
