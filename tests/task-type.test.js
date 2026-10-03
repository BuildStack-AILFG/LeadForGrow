/**
 * Automatic follow-up tasks default to "call"; that must not be created for leads that have no phone number.
 * Run: node --test tests/task-type.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickTaskTypeForLead } from '../lib/crm/taskType.js';

describe('pickTaskTypeForLead', () => {
  it('keeps "call" for a lead that has a phone number', () => {
    assert.equal(pickTaskTypeForLead('call', { phone: '919876543210' }), 'call');
    assert.equal(pickTaskTypeForLead('call', { phone: '+91 98765-43210', email: 'a@b.co' }), 'call');
  });

  it('phone-less lead with an email -> "email"', () => {
    assert.equal(pickTaskTypeForLead('call', { email: 'a@b.co' }), 'email');
  });

  it('phone-less lead with no email (Instagram / Messenger) -> generic "follow_up"', () => {
    assert.equal(pickTaskTypeForLead('call', { name: '@build.himanshu', source: 'instagram' }), 'follow_up');
    assert.equal(pickTaskTypeForLead('call', { phone: '', email: '' }), 'follow_up');
  });

  it('a phone value with no digits does not count as a phone', () => {
    assert.equal(pickTaskTypeForLead('call', { phone: ' - ' }), 'follow_up');
  });

  it('never changes any other type (meeting, whatsapp, ...) even without a phone', () => {
    for (const t of ['meeting', 'whatsapp', 'email', 'follow_up', 'other']) {
      assert.equal(pickTaskTypeForLead(t, {}), t);
    }
  });

  it('without a lead it leaves the type alone', () => {
    assert.equal(pickTaskTypeForLead('call', null), 'call');
    assert.equal(pickTaskTypeForLead('call', undefined), 'call');
  });

  it('returns a value the Task schema accepts', () => {
    const allowed = ['call', 'whatsapp', 'email', 'meeting', 'follow_up', 'other'];
    for (const lead of [{}, { email: 'a@b.co' }, { phone: '919876543210' }]) {
      assert.ok(allowed.includes(pickTaskTypeForLead('call', lead)));
    }
  });
});
