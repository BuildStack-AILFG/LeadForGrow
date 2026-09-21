/**
 * Inbox notifications: every channel needs its own notification type (schema enum) and its own icon in the bell dropdown.
 * Facebook used to fall back to "whatsapp_message", so a Messenger message showed up as "New whatsapp message".
 * Run: node --test tests/notification-types.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let INBOX_TYPES, CHANNELS, Notification;
const bell = readFileSync(new URL('../app/automation/components/NotificationCenter.js', import.meta.url), 'utf8');

before(async () => {
  ({ INBOX_TYPES } = await import('../lib/omnichannel/notifications.js'));
  ({ CHANNELS } = await import('../lib/omnichannel/constants.js'));
  ({ default: Notification } = await import('../models/automation/Notification.js'));
});

describe('inbox notification types', () => {
  it('every messaging channel has its own notification type', () => {
    for (const channel of CHANNELS) {
      assert.ok(INBOX_TYPES[channel], `${channel} has no entry in INBOX_TYPES (it would be mislabelled as whatsapp)`);
    }
    assert.equal(new Set(CHANNELS.map((c) => INBOX_TYPES[c])).size, CHANNELS.length, 'two channels share a type');
  });

  it('each of those types is accepted by the Notification schema', () => {
    const allowed = Notification.schema.path('type').enumValues;
    for (const channel of CHANNELS) assert.ok(allowed.includes(INBOX_TYPES[channel]), `${INBOX_TYPES[channel]} not in the Notification enum`);
  });

  it('Messenger is facebook_message, not whatsapp_message', () => {
    assert.equal(INBOX_TYPES.facebook, 'facebook_message');
  });
});

describe('bell dropdown icons', () => {
  it('every channel notification type has a case in getIcon', () => {
    for (const channel of CHANNELS) {
      assert.ok(bell.includes(`case '${INBOX_TYPES[channel]}'`), `NotificationCenter has no icon for ${INBOX_TYPES[channel]}`);
    }
  });

  it('uses the real brand marks, not lucide MessageCircle / Instagram / Mail', () => {
    for (const mark of ['<WhatsAppIcon colored', '<InstagramIcon colored', '<FacebookIcon colored', '<GmailIcon']) {
      assert.ok(bell.includes(mark), `${mark} missing`);
    }
    assert.doesNotMatch(bell, /<MessageCircle|<Instagram |<Mail /);
  });
});
