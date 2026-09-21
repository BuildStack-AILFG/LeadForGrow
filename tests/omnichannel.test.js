import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, MESSAGE_ACTIVITY_MAP } from '../lib/omnichannel/constants.js';

describe('Omnichannel constants', () => {
  it('supports whatsapp, instagram, facebook, email channels', () => {
    assert.deepEqual(CHANNELS, ['whatsapp', 'instagram', 'facebook', 'email']);
  });

  it('maps channels to activity types', () => {
    assert.equal(MESSAGE_ACTIVITY_MAP.whatsapp.incoming, 'whatsapp_received');
    assert.equal(MESSAGE_ACTIVITY_MAP.instagram.incoming, 'instagram_received');
    assert.equal(MESSAGE_ACTIVITY_MAP.email.outgoing, 'email_sent');
  });

  it('maps all channel directions', () => {
    // Facebook deliberately has no Activity enum type yet: conversationService skips the activity when unmapped.
    for (const ch of CHANNELS.filter((c) => c !== 'facebook')) {
      assert.ok(MESSAGE_ACTIVITY_MAP[ch].incoming);
      assert.ok(MESSAGE_ACTIVITY_MAP[ch].outgoing);
    }
  });
});

describe('Omnichannel realtime events', () => {
  it('includes message status event', async () => {
    const { REALTIME_EVENTS } = await import('../lib/realtime/constants.js');
    assert.equal(REALTIME_EVENTS.CHAT_MESSAGE_STATUS, 'chat.message_status');
  });
});
