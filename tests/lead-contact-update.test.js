/**
 * Adding a phone / email to a lead (profile card "Add" -> PUT /api/automation/leads/[id]).
 * Offline: the duplicate lookup is injected. Run: node --test tests/lead-contact-update.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildContactUpdates, phoneClashFilter } from '../lib/crm/leadContactUpdate.js';

const noClash = async () => null;
const lead = { _id: 'lead1', name: '@build.himanshu' };

describe('phone', () => {
  it('stores digits only and copies to whatsapp when that is empty', async () => {
    const r = await buildContactUpdates({ body: { phone: '+91 98765-43210' }, lead, findClash: noClash });
    assert.deepEqual(r.updates, { phone: '919876543210', whatsapp: '919876543210' });
  });

  it('does not overwrite an existing whatsapp number', async () => {
    const r = await buildContactUpdates({ body: { phone: '+91 98765 43210' }, lead: { ...lead, whatsapp: '911111111111' }, findClash: noClash });
    assert.deepEqual(r.updates, { phone: '919876543210' });
  });

  it('rejects numbers that are too short or too long (country code required)', async () => {
    for (const phone of ['12345', '+1234567', '1234567890123456']) {
      const r = await buildContactUpdates({ body: { phone }, lead, findClash: noClash });
      assert.equal(r.status, 400, phone);
      assert.match(r.error, /country code/);
    }
  });

  it('rejects a number that already belongs to another lead (409, names the lead)', async () => {
    const r = await buildContactUpdates({ body: { phone: '9876543210' }, lead, findClash: async () => ({ name: 'Ravi' }) });
    assert.equal(r.status, 409);
    assert.match(r.error, /another lead \(Ravi\)/);
  });

  it('asks the duplicate lookup with the normalised digits', async () => {
    let asked = null;
    await buildContactUpdates({ body: { phone: '+91 (98765) 43210' }, lead, findClash: async (d) => { asked = d; return null; } });
    assert.equal(asked, '919876543210');
  });

  it('an empty value is ignored: it never clears the number', async () => {
    const r = await buildContactUpdates({ body: { phone: '  ' }, lead, findClash: noClash });
    assert.deepEqual(r.updates, {});
  });
});

describe('email', () => {
  it('lower-cases and trims', async () => {
    const r = await buildContactUpdates({ body: { email: '  Foo@Example.COM ' }, lead, findClash: noClash });
    assert.deepEqual(r.updates, { email: 'foo@example.com' });
  });

  it('rejects malformed addresses', async () => {
    for (const email of ['foo', 'foo@', '@bar.com', 'a b@c.com', 'foo@bar']) {
      const r = await buildContactUpdates({ body: { email }, lead, findClash: noClash });
      assert.equal(r.status, 400, email);
    }
  });

  it('phone and email together, and neither given', async () => {
    const both = await buildContactUpdates({ body: { phone: '919876543210', email: 'a@b.co' }, lead, findClash: noClash });
    assert.equal(both.updates.email, 'a@b.co');
    assert.equal(both.updates.phone, '919876543210');
    assert.deepEqual((await buildContactUpdates({ body: {}, lead, findClash: noClash })).updates, {});
  });
});

describe('phoneClashFilter', () => {
  it('is scoped to the business, excludes the lead itself, and matches exact + last-10-digit numbers', () => {
    const f = phoneClashFilter({ businessId: 'biz1', leadId: 'lead1', digits: '919876543210' });
    assert.equal(f.businessId, 'biz1');
    assert.deepEqual(f._id, { $ne: 'lead1' });
    assert.deepEqual(f.$or, [
      { phone: '919876543210' }, { whatsappId: '919876543210' },
      { phone: { $regex: String.raw`9\D*8\D*7\D*6\D*5\D*4\D*3\D*2\D*1\D*0$` } },
      { whatsappId: { $regex: String.raw`9\D*8\D*7\D*6\D*5\D*4\D*3\D*2\D*1\D*0$` } },
    ]);
  });
});
