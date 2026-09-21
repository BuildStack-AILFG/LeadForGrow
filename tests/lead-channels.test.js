/**
 * Lead-details page must follow the lead's real channel, not assume WhatsApp.
 * Run: node --test tests/lead-channels.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMessageChannels, getPrimaryChannel, getReplyChannels, getConversationId, canOpenWhatsApp,
  getReplyWindow, formatWindowLeft, REPLY_WINDOW_MS, getChannelSuggestion, getInstagramHandle,
} from '../app/automation/components/leads/detail/leadChannels.js';

const igDm = { channel: 'instagram', conversationId: 'c_ig', timestamp: '2026-09-18T23:29:00Z', direction: 'incoming' };
const waMsg = { channel: 'whatsapp', conversationId: 'c_wa', timestamp: '2026-09-19T10:00:00Z', direction: 'incoming' };

describe('lead channels', () => {
  it('an Instagram lead with only an Instagram DM is Instagram — not WhatsApp', () => {
    const lead = { source: 'instagram' };
    assert.deepEqual(getMessageChannels([igDm]), ['instagram']);
    assert.equal(getPrimaryChannel(lead, [igDm]), 'instagram');
    assert.deepEqual(getReplyChannels(lead, [igDm]), ['instagram']);
    assert.equal(canOpenWhatsApp(lead), false);
    assert.equal(getConversationId([igDm], 'instagram'), 'c_ig');
  });

  it('with no messages yet it falls back to the lead source, then WhatsApp', () => {
    assert.equal(getPrimaryChannel({ source: 'instagram' }, []), 'instagram');
    assert.equal(getPrimaryChannel({ source: 'facebook_ad' }, []), 'facebook');
    assert.equal(getPrimaryChannel({ source: 'website' }, []), 'whatsapp');
    assert.equal(getPrimaryChannel({}, []), 'whatsapp');
  });

  it('a lead on two channels defaults to the latest message and offers both', () => {
    const lead = { source: 'instagram', phone: '+919999999999' };
    const msgs = [igDm, waMsg];
    assert.equal(getPrimaryChannel(lead, msgs), 'whatsapp');
    assert.deepEqual(getReplyChannels(lead, msgs), ['whatsapp', 'instagram']);
    assert.equal(getConversationId(msgs, 'instagram'), 'c_ig');
  });

  it('internal notes never count as a channel or set the default', () => {
    const note = { channel: 'whatsapp', isInternal: true, timestamp: '2026-09-20T00:00:00Z' };
    assert.deepEqual(getMessageChannels([igDm, note]), ['instagram']);
    assert.equal(getPrimaryChannel({ source: 'instagram' }, [igDm, note]), 'instagram');
    assert.equal(getConversationId([igDm, note], 'whatsapp'), null);
  });

  it('WhatsApp is offered when the lead has a phone even before any WhatsApp message', () => {
    assert.deepEqual(getReplyChannels({ source: 'instagram', phone: '+91999' }, [igDm]), ['whatsapp', 'instagram']);
  });
});

describe('24-hour reply window', () => {
  const t0 = new Date('2026-09-20T10:00:00Z').getTime();
  const hr = 3600_000;
  const dm = (over = {}) => ({ channel: 'instagram', conversationId: 'c1', direction: 'incoming', timestamp: new Date(t0).toISOString(), content: { participantId: '1789' }, ...over });

  it('is open for 24h after the customer last messaged, with the time left', () => {
    const w = getReplyWindow([dm()], 'instagram', t0 + 5 * hr);
    assert.equal(w.state, 'open');
    assert.equal(w.msLeft, 19 * hr);
    assert.equal(formatWindowLeft(w.msLeft), '19h 0m');
  });

  it('closes exactly at 24h', () => {
    assert.equal(getReplyWindow([dm()], 'instagram', t0 + REPLY_WINDOW_MS - 1).state, 'open');
    assert.equal(getReplyWindow([dm()], 'instagram', t0 + REPLY_WINDOW_MS).state, 'closed');
  });

  it('our own outgoing replies do not extend the window — only the customer messages do', () => {
    const out = dm({ direction: 'outgoing', timestamp: new Date(t0 + 20 * hr).toISOString() });
    assert.equal(getReplyWindow([dm(), out], 'instagram', t0 + 25 * hr).state, 'closed');
  });

  it('a newer incoming message re-opens it', () => {
    const later = dm({ timestamp: new Date(t0 + 23 * hr).toISOString() });
    assert.equal(getReplyWindow([dm(), later], 'instagram', t0 + 30 * hr).state, 'open');
  });

  it('is never restricted on a guess: no incoming timestamp -> unknown', () => {
    assert.equal(getReplyWindow([dm({ direction: 'outgoing' })], 'instagram', t0).state, 'unknown');
    assert.equal(getReplyWindow([dm({ timestamp: undefined })], 'instagram', t0).state, 'unknown');
    assert.equal(getReplyWindow([], 'instagram', t0).state, 'unknown');
  });

  it('email has no window, and public-comment threads are not windowed', () => {
    assert.equal(getReplyWindow([dm({ channel: 'email' })], 'email', t0 + 99 * hr).state, 'none');
    const comment = dm({ content: { participantId: 'ig_comment:1789' } });
    assert.equal(getReplyWindow([comment], 'instagram', t0 + 99 * hr).state, 'none');
  });

  it('checks the same conversation the reply will go to (latest message wins)', () => {
    const oldDm = dm({ conversationId: 'dm', timestamp: new Date(t0).toISOString() });
    const newComment = dm({ conversationId: 'cm', timestamp: new Date(t0 + 50 * hr).toISOString(), content: { participantId: 'ig_comment:1789' } });
    assert.equal(getReplyWindow([oldDm, newComment], 'instagram', t0 + 60 * hr).state, 'none');
  });

  it('formats short and long remainders', () => {
    assert.equal(formatWindowLeft(40 * 60_000), '40m');
    assert.equal(formatWindowLeft(5 * hr + 20 * 60_000), '5h 20m');
    assert.equal(formatWindowLeft(-5), '0m');
  });
});

describe('channel suggestion', () => {
  const t0 = new Date('2026-09-20T10:00:00Z').getTime();
  const hr = 3600_000;
  const msg = (over = {}) => ({ channel: 'instagram', conversationId: 'c1', direction: 'incoming', timestamp: new Date(t0).toISOString(), content: { participantId: '1' }, ...over });

  it('unanswered incoming message inside the window -> reply, with the time left', () => {
    const s = getChannelSuggestion([msg()], t0 + 2 * hr);
    assert.equal(s.tone, 'action');
    assert.match(s.text, /Reply on Instagram: 22h 0m left/);
  });

  it('unanswered incoming message after the window -> warning, not a useless "reply"', () => {
    const s = getChannelSuggestion([msg()], t0 + 30 * hr);
    assert.equal(s.tone, 'warning');
    assert.match(s.text, /Instagram window closed/);
    assert.match(getChannelSuggestion([msg({ channel: 'whatsapp' })], t0 + 30 * hr).text, /template/);
  });

  it('when we replied last, or there are no messages, it defers to the stage-based suggestion (null)', () => {
    const ours = msg({ direction: 'outgoing', timestamp: new Date(t0 + hr).toISOString() });
    assert.equal(getChannelSuggestion([msg(), ours], t0 + 2 * hr), null);
    assert.equal(getChannelSuggestion([], t0), null);
  });
});

describe('instagram handle', () => {
  it('reads metadata (plain object or Map) or the @name of an Instagram lead', () => {
    assert.equal(getInstagramHandle({ metadata: { instagramUsername: 'pistons_garage_official' } }), 'pistons_garage_official');
    assert.equal(getInstagramHandle({ metadata: new Map([['instagramUsername', 'abc.def']]) }), 'abc.def');
    assert.equal(getInstagramHandle({ source: 'instagram', name: '@build.himanshu' }), 'build.himanshu');
  });

  it('never builds a link from something that is not a valid handle', () => {
    assert.equal(getInstagramHandle({ source: 'instagram', name: '@bad handle/../x' }), null);
    assert.equal(getInstagramHandle({ source: 'website', name: '@someone' }), null);
    assert.equal(getInstagramHandle({}), null);
  });
});
