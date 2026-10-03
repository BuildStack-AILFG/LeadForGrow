/**
 * The "new message" toast: real brand icon, the right channel label, and WHO wrote (the toast said "from a customer").
 * Run: node --test tests/incoming-toast.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let React, renderToStaticMarkup, Card;
before(async () => {
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ IncomingMessageCard: Card } = await import('../app/automation/components/chat/IncomingMessageToast.jsx'));
});

const html = (props) => renderToStaticMarkup(React.createElement(Card, props));

describe('IncomingMessageCard', () => {
  it('shows the channel label, the sender and a preview', () => {
    const out = html({ channel: 'whatsapp', senderName: 'Sandeep Swaroop', preview: 'Morning' });
    assert.ok(out.includes('New WhatsApp message'));
    assert.ok(out.includes('Sandeep Swaroop'));
    assert.ok(out.includes(': Morning'));
  });

  it('uses the real coloured brand mark, not an emoji', () => {
    const out = html({ channel: 'whatsapp', senderName: 'A' });
    assert.ok(out.includes('<svg') && out.includes('#25D366'), 'official WhatsApp green');
    assert.ok(!/💬|📸|📧/.test(out));
  });

  it('each channel gets its own label and mark (Messenger was labelled WhatsApp before)', () => {
    assert.ok(html({ channel: 'instagram', senderName: 'A' }).includes('New Instagram message'));
    assert.ok(html({ channel: 'facebook', senderName: 'A' }).includes('New Facebook message'));
    assert.ok(html({ channel: 'email', senderName: 'A' }).includes('New Email message'));
    assert.ok(html({ channel: 'facebook', senderName: 'A' }).includes('#1877F2'));
    assert.ok(!html({ channel: 'facebook', senderName: 'A' }).includes('New WhatsApp message'));
  });

  it('never leaves the sender blank: "A customer" only when the name is truly unknown', () => {
    assert.ok(html({ channel: 'whatsapp' }).includes('A customer'));
    assert.ok(!html({ channel: 'whatsapp', senderName: 'Riya' }).includes('A customer'));
  });

  it('is dark-mode paired and truncates a long preview', () => {
    const out = html({ channel: 'whatsapp', senderName: 'A', preview: 'x'.repeat(300) });
    assert.ok(out.includes('bg-white dark:bg-slate-900') && out.includes('border-slate-200 dark:border-slate-700'));
    assert.ok(out.includes('truncate'));
  });
});

describe('wiring', () => {
  it('the inbox hook uses it, prefers the name on the event, and one message can only ever make one toast', () => {
    const hook = read('app/automation/hooks/useChatInbox.js');
    assert.ok(hook.includes('showIncomingMessageToast({') && hook.includes('event.data.senderName || known?.leadId?.name'));
    assert.ok(!hook.includes('a customer'), 'the hard-coded fallback text is gone');
    assert.ok(!/💬 WhatsApp|📸 Instagram|📧 email/.test(hook));
    assert.ok(read('app/automation/components/chat/IncomingMessageToast.jsx').includes('id: `incoming_${messageId}`'));
  });

  it('the server puts the sender and a short preview on the realtime event (only for incoming messages)', () => {
    const svc = read('lib/omnichannel/conversationService.js');
    assert.ok(svc.includes("...(senderName ? { senderName } : {})"));
    assert.ok(svc.includes("...(direction === 'incoming' && preview ? { preview: String(preview).slice(0, 120) } : {})"));
    assert.ok(svc.includes("const senderName = direction === 'incoming'"));
    assert.ok(!svc.includes("await import('@/models/automation/Lead')"), 'the lead is loaded once, not twice');
  });

  it('the browser notification names the channel and the sender instead of always "WhatsApp"', () => {
    const src = read('app/automation/hooks/useAppNotifications.js');
    assert.ok(src.includes('CHANNEL_META[event.data?.channel]?.label') && src.includes('`${channelLabel} · ${from}`'));
    assert.ok(!src.includes("title: 'New WhatsApp message'"));
  });

  it('the bell notification title is "New WhatsApp message", not the lower-case key', () => {
    const n = read('lib/omnichannel/notifications.js');
    assert.ok(n.includes('CHANNEL_META[channel]?.label || channel') && !n.includes('`New ${channel} message`'));
  });
});
