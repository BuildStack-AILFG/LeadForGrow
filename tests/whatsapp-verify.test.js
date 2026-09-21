/**
 * The "Sync status" button on the WhatsApp settings page sends only { verifyOnly: true }. The verify endpoint crashed on it
 * ("Cannot read properties of undefined (reading 'provider')"). Run: node --test tests/whatsapp-verify.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let resolveVerifySettings, metaPhoneFields, Message;
before(async () => {
  ({ resolveVerifySettings, metaPhoneFields } = await import('../lib/whatsapp/verifySettings.js'));
  ({ default: Message } = await import('../models/automation/Message.js'));
});

describe('resolveVerifySettings', () => {
  const stored = { provider: 'meta', apiKey: 'ENC_TOKEN', phoneNumberId: '1251139594744650' };

  it('Sync status (no form values) verifies the credentials already saved', () => {
    const r = resolveVerifySettings({ whatsappSettings: undefined, stored });
    assert.equal(r.settings, stored);
    assert.equal(r.fromStored, true);
    assert.equal(r.settings.provider, 'meta'); // the exact read that used to throw
  });

  it('the credential form still verifies what was typed, not what is saved', () => {
    const typed = { provider: 'interakt', interaktApiKey: 'k' };
    const r = resolveVerifySettings({ whatsappSettings: typed, stored });
    assert.equal(r.settings, typed);
    assert.equal(r.fromStored, undefined);
  });

  it('Sync on a business that never connected WhatsApp gives a clear message instead of a crash', () => {
    for (const s of [undefined, {}, { provider: 'meta' }]) {
      const r = resolveVerifySettings({ whatsappSettings: undefined, stored: s });
      assert.equal(r.status, 400);
      assert.match(r.error, /not connected yet/i);
    }
  });

  it('an Interakt-only business can sync too', () => {
    const r = resolveVerifySettings({ whatsappSettings: undefined, stored: { provider: 'interakt', interaktApiKey: 'x' } });
    assert.ok(r.settings);
  });
});

describe('metaPhoneFields', () => {
  it('keeps Meta quality rating (upper-case, as the settings screen expects) and display number', () => {
    assert.deepEqual(metaPhoneFields({ quality_rating: 'green', display_phone_number: '+91 88105 12345', verified_name: 'x' }),
      { qualityRating: 'GREEN', displayNumber: '+91 88105 12345' });
  });
  it('adds nothing when Meta returned neither', () => {
    assert.deepEqual(metaPhoneFields({}), {});
    assert.deepEqual(metaPhoneFields(undefined), {});
  });
});

describe('Message types WhatsApp really sends', () => {
  const ok = (type) => new Message({ businessId: new (Message.base.Types.ObjectId)(), leadId: new (Message.base.Types.ObjectId)(), messageId: 'm_' + type, direction: 'incoming', type, content: { body: 'x' } });

  it('"system" and "unsupported" no longer fail validation (they crashed the whole inbound webhook on 8-9 Sep)', async () => {
    for (const type of ['system', 'unsupported', 'reaction', 'order', 'text', 'interactive']) {
      const err = ok(type).validateSync();
      assert.equal(err?.errors?.type, undefined, `${type}: ${err?.errors?.type?.message}`);
    }
  });

  it('a genuinely unknown type is still rejected', () => {
    assert.ok(ok('carrier_pigeon').validateSync()?.errors?.type);
  });
});

describe('what Sync stores must be readable by the settings route', () => {
  it('qualityRating and displayNumber are readable as properties, like the whatsapp-status route reads them', async () => {
    // Regression: Sync saved GREEN but the screen kept showing "Unknown", because these two fields were not declared in the
    // Business schema, so `wa.qualityRating` was undefined even though the database had the value.
    const { default: Business } = await import('../models/Business.js');
    const { default: mongoose } = await import('mongoose');
    const b = Business.hydrate({
      _id: new mongoose.Types.ObjectId(), businessName: 'x', ownerId: new mongoose.Types.ObjectId(),
      integrationCredentials: { whatsapp: { enabled: true, phoneNumberId: '1251139594744650', qualityRating: 'GREEN', displayNumber: '+91 63669 66120' } },
    });
    const wa = b.integrationCredentials.whatsapp;
    assert.equal(wa.qualityRating, 'GREEN');
    assert.equal(wa.displayNumber, '+91 63669 66120');
  });
});
