/**
 * Customer-facing automatic messages: new businesses start with them OFF, existing businesses are unchanged,
 * and the Won "thank you" is controlled by toggles like every other message.
 * Offline (no DB connection). Run: node --test tests/crm-message-defaults.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let Business, mongoose, getCrmSettings, mergeCrmSettingsPayload, CRM_CUSTOMER_MESSAGE_TOGGLES, withNewBusinessMessageDefaults,
  CRM_MESSAGE_GROUPS, CRM_SETTINGS_SAVE_KEYS, planWonThanks, DEFAULT_CRM_TEMPLATES;

before(async () => {
  ({ default: mongoose } = await import('mongoose'));
  ({ default: Business } = await import('../models/Business.js'));
  ({ getCrmSettings, mergeCrmSettingsPayload } = await import('../lib/crm/crmSettings.js'));
  ({ CRM_CUSTOMER_MESSAGE_TOGGLES, withNewBusinessMessageDefaults } = await import('../lib/crm/messageToggles.js'));
  ({ CRM_MESSAGE_GROUPS, CRM_SETTINGS_SAVE_KEYS } = await import('../lib/crm/crmSettings.constants.js'));
  ({ planWonThanks } = await import('../lib/crm/wonThanks.js'));
  ({ DEFAULT_CRM_TEMPLATES } = await import('../lib/crm/templateVars.js'));
});

const oid = () => new mongoose.Types.ObjectId();

describe('existing businesses are unchanged', () => {
  it('an unset toggle still means ON (this is how every business created before today behaves)', () => {
    const s = getCrmSettings({ settings: {} });
    for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) assert.equal(s[key], true, key);
  });

  it('an existing document loaded from the database is NOT switched off by the new-business hook', async () => {
    const old = Business.hydrate({ _id: oid(), businessName: 'Old Co', ownerId: oid() });
    await old.validate();
    const s = getCrmSettings(old);
    for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) assert.equal(s[key], true, key);
  });

  it('an existing business that switched one message off keeps exactly that choice', () => {
    const s = getCrmSettings({ settings: { crm: { sendMeetingWhatsApp: false } } });
    assert.equal(s.sendMeetingWhatsApp, false);
    assert.equal(s.sendWelcomeWhatsApp, true);
    assert.equal(s.sendWonThanksEmail, true);
  });
});

describe('new businesses start with every customer message OFF', () => {
  it('a newly created business gets all toggles stored as false', async () => {
    const b = new Business({ businessName: 'New Co', ownerId: oid() });
    await b.validate();
    for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) assert.equal(b.settings.crm[key], false, key);
    const s = getCrmSettings(b);
    for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) assert.equal(s[key], false, key);
  });

  it('respects a toggle the creator set explicitly and leaves other settings alone', async () => {
    const b = new Business({ businessName: 'New Co', ownerId: oid(), settings: { crm: { sendWelcomeEmail: true, defaultFollowUpHours: 12 } } });
    await b.validate();
    assert.equal(b.settings.crm.sendWelcomeEmail, true);
    assert.equal(b.settings.crm.sendWelcomeWhatsApp, false);
    assert.equal(b.settings.crm.defaultFollowUpHours, 12);
  });

  it('non-message CRM behaviour (internal tasks, team notifications) is not switched off', async () => {
    const b = new Business({ businessName: 'New Co', ownerId: oid() });
    await b.validate();
    const s = getCrmSettings(b);
    assert.equal(s.autoCreateFollowUpTask, true);
    assert.equal(s.notifyTeamOnNewLead, true);
    assert.equal(s.requireLostReason, true);
  });

  it('the helper turns off only unset keys', () => {
    const out = withNewBusinessMessageDefaults({ sendWonThanksEmail: true, foo: 1 });
    assert.equal(out.sendWonThanksEmail, true);
    assert.equal(out.sendWelcomeEmail, false);
    assert.equal(out.foo, 1);
  });
});

describe('settings screen wiring stays consistent', () => {
  it('every toggle shown in the UI is a customer-message toggle, saved, and returned by getCrmSettings', () => {
    const shown = CRM_MESSAGE_GROUPS.flatMap((g) => g.channels.map((c) => c.toggleKey));
    const settings = getCrmSettings({ settings: {} });
    for (const key of shown) {
      assert.ok(CRM_CUSTOMER_MESSAGE_TOGGLES.includes(key), `${key} missing from CRM_CUSTOMER_MESSAGE_TOGGLES`);
      assert.ok(CRM_SETTINGS_SAVE_KEYS.includes(key), `${key} missing from SAVE_KEYS`);
      assert.ok(key in settings, `${key} not returned by getCrmSettings`);
      assert.equal(mergeCrmSettingsPayload({ [key]: false })[key], false, `${key} dropped by mergeCrmSettingsPayload`);
    }
    // ...and the other way round: no message toggle exists without a UI switch.
    for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) assert.ok(shown.includes(key), `${key} has no switch in the settings UI`);
  });

  it('the Won thank-you has its own group with WhatsApp and email switches and editable text', () => {
    const won = CRM_MESSAGE_GROUPS.find((g) => g.id === 'won');
    assert.deepEqual(won.channels.map((c) => c.toggleKey), ['sendWonThanksWhatsApp', 'sendWonThanksEmail']);
    const s = getCrmSettings({ settings: {} });
    assert.ok('wonWhatsApp' in s.templates && 'wonEmail' in s.templates && 'wonEmail' in s.emailSubjects);
    assert.deepEqual(mergeCrmSettingsPayload({ templates: { wonWhatsApp: 'hi' } }).templates, { wonWhatsApp: 'hi' });
  });
});

describe('Won thank-you (planWonThanks)', () => {
  const ctx = { customer_name: 'Rahul', company: 'Acme' };
  const lead = { phone: '919876543210', email: 'r@x.co' };
  const on = { sendWonThanksWhatsApp: true, sendWonThanksEmail: true };

  it('sends nothing when both toggles are off (the new-business default)', () => {
    assert.deepEqual(planWonThanks({ settings: { sendWonThanksWhatsApp: false, sendWonThanksEmail: false }, lead, context: ctx }), { whatsapp: null, email: null });
  });

  it('sends on each channel only when its toggle is on AND the lead has that contact', () => {
    assert.equal(planWonThanks({ settings: { sendWonThanksWhatsApp: true }, lead, context: ctx }).email, null);
    assert.equal(planWonThanks({ settings: { sendWonThanksEmail: true }, lead, context: ctx }).whatsapp, null);
    assert.equal(planWonThanks({ settings: on, lead: { email: 'r@x.co' }, context: ctx }).whatsapp, null);
    assert.equal(planWonThanks({ settings: on, lead: { phone: '919876543210' }, context: ctx }).email, null);
  });

  it('default wording is identical to the old hard-coded message, so existing businesses see no change', () => {
    const p = planWonThanks({ settings: on, lead, context: ctx });
    assert.equal(p.whatsapp, "Thank you Rahul! We're excited to work with you.");
    assert.equal(p.email.body, "Thank you Rahul! We're excited to work with you.");
    assert.equal(p.email.subject, 'Thank you');
    assert.equal(DEFAULT_CRM_TEMPLATES.won_whatsapp, DEFAULT_CRM_TEMPLATES.won_email);
  });

  it('uses the business own text and subject when they set one', () => {
    const settings = { ...on, templates: { wonWhatsApp: 'Welcome aboard, {{customer_name}}!', wonEmail: 'Hi {{customer_name}} from {{company}}' }, emailSubjects: { wonEmail: 'Welcome to {{company}}' } };
    const p = planWonThanks({ settings, lead, context: ctx });
    assert.equal(p.whatsapp, 'Welcome aboard, Rahul!');
    assert.equal(p.email.body, 'Hi Rahul from Acme');
    assert.equal(p.email.subject, 'Welcome to Acme');
  });
});
