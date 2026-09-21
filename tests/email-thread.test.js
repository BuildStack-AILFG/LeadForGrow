/**
 * Email thread view: pure planning logic + real rendering (react-dom/server) of the cards.
 * Run: node --test tests/email-thread.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

let T, React, renderToStaticMarkup, EmailThread, EmailMessageCard;
before(async () => {
  T = await import('../lib/omnichannel/emailThread.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: EmailThread } = await import('../app/automation/components/chat/EmailThread.jsx'));
  ({ default: EmailMessageCard } = await import('../app/automation/components/chat/EmailMessageCard.jsx'));
});

const conv = { participantName: 'Himanshu Singh', participantEmail: 'himanshu@gmail.com', channel: 'email' };
let n = 0;
const mail = (over = {}) => {
  n += 1;
  return {
    _id: `m${n}`, type: 'email', direction: 'incoming', timestamp: new Date(2026, 8, 12, 22, 29 + n).toISOString(),
    subject: 'Retest', status: 'received', content: { body: `body ${n}`, participantName: 'Himanshu Singh', participantEmail: 'himanshu@gmail.com', ...(over.content || {}) },
    ...over,
    ...(over.content ? { content: { body: `body ${n}`, participantName: 'Himanshu Singh', participantEmail: 'himanshu@gmail.com', ...over.content } } : {}),
  };
};
const thread = (count) => Array.from({ length: count }, (_, i) => mail({ direction: i % 2 ? 'outgoing' : 'incoming' }));
const render = (el) => renderToStaticMarkup(el);
const html = (messages, extra = {}) => render(React.createElement(EmailThread, { messages, conversation: conv, onAction: () => {}, ...extra }));

describe('planThreadView', () => {
  it('short threads (4 cards or fewer) are fully expanded', () => {
    const { items, collapsible } = T.planThreadView(thread(4));
    assert.equal(collapsible, false);
    assert.ok(items.every((i) => i.card && !i.collapsed));
  });

  it('longer threads collapse the old ones but keep the newest card and the newest INCOMING card open', () => {
    const msgs = thread(7); // incoming at 0,2,4,6 ; outgoing at 1,3,5
    const { items, collapsible } = T.planThreadView(msgs);
    assert.equal(collapsible, true);
    const open = items.filter((i) => !i.collapsed).map((i) => i.message._id);
    assert.deepEqual(open, [msgs[6]._id]); // newest is also the newest incoming
    // 7 cards where the newest is OUR reply: the newest incoming one (index 4) stays open too, it is what we are answering
    const msgs2 = [...thread(6), mail({ direction: 'outgoing' })];
    assert.equal(msgs2[4].direction, 'incoming');
    assert.equal(msgs2[5].direction, 'outgoing');
    const open2 = T.planThreadView(msgs2).items.filter((i) => !i.collapsed).map((i) => i.message._id);
    assert.deepEqual(open2, [msgs2[4]._id, msgs2[6]._id]);
  });

  it('what the user toggled always wins', () => {
    const msgs = thread(6);
    const { items } = T.planThreadView(msgs, { overrides: { [msgs[0]._id]: false, [msgs[5]._id]: true } });
    assert.equal(items[0].collapsed, false);
    assert.equal(items[5].collapsed, true);
  });

  it('notes, deleted and system rows are never cards and never collapsed', () => {
    const msgs = [...thread(6), mail({ isInternal: true, type: 'text' }), mail({ isDeleted: true }), mail({ direction: 'system', type: 'text' })];
    const { items } = T.planThreadView(msgs);
    assert.ok(items.slice(6).every((i) => !i.card && !i.collapsed));
  });
});

describe('subjects, snippets, dates', () => {
  it('a subject is repeated only when it really changed ("Re:" is not a change)', () => {
    assert.equal(T.shouldShowSubject({ subject: 'Re: Retest' }, 'Retest'), false);
    assert.equal(T.shouldShowSubject({ subject: 'RE: FWD: retest ' }, 'Retest'), false);
    assert.equal(T.shouldShowSubject({ subject: 'Different topic' }, 'Retest'), true);
    assert.equal(T.shouldShowSubject({}, 'Retest'), false);
    assert.equal(T.threadSubject([{ type: 'text' }, { type: 'email', subject: 'First' }, { type: 'email', subject: 'Second' }]), 'First');
  });

  it('snippet: new text only (no quote, no URLs), else the first attachment, else "(no text)"', () => {
    assert.equal(T.snippetOf({ content: { body: 'Thanks!\n\nOn Mon, X wrote:\n> old stuff' } }), 'Thanks!');
    assert.equal(T.snippetOf({ content: { body: 'Hi https://track.example.com/x?y=1 there' } }), 'Hi there');
    assert.equal(T.snippetOf({ content: { body: '', attachments: [{ fileName: 'offer.pdf' }] } }), 'offer.pdf');
    assert.equal(T.snippetOf({ content: { body: '' } }), '(no text)');
    assert.ok(T.snippetOf({ content: { body: 'x'.repeat(400) } }).length <= 120);
  });

  it('splitQuotedBody handles Gmail, Outlook and ">" quoting', () => {
    assert.deepEqual(T.splitQuotedBody('Hello\nOn Tue, 1 Sep 2026, A <a@b.c> wrote:\n> hi'), { newBody: 'Hello', quotedBody: 'On Tue, 1 Sep 2026, A <a@b.c> wrote:\n> hi' });
    assert.equal(T.splitQuotedBody('Reply\n-----Original Message-----\nFrom: x').newBody, 'Reply');
    assert.equal(T.splitQuotedBody('Reply\n> quoted line').newBody, 'Reply');
    assert.deepEqual(T.splitQuotedBody('plain'), { newBody: 'plain', quotedBody: '' });
    assert.deepEqual(T.splitQuotedBody(''), { newBody: '', quotedBody: '' });
  });

  it('card dates: time today, "12 Sep, 22:29" this year, with the year before that', () => {
    const now = new Date(2026, 8, 20, 12, 0);
    assert.equal(T.formatCardDate(new Date(2026, 8, 20, 9, 5), now), '09:05');
    assert.equal(T.formatCardDate(new Date(2026, 8, 12, 22, 29), now), '12 Sep, 22:29');
    assert.equal(T.formatCardDate(new Date(2025, 11, 31, 8, 0), now), '31 Dec 2025');
    assert.equal(T.formatCardDate(null, now), '');
    assert.equal(T.formatCardDate('garbage', now), '');
  });

  it('sender and recipient lines follow the old header rules', () => {
    assert.deepEqual(T.senderOf({ direction: 'outgoing', content: {} }, conv), { outgoing: true, name: 'You', email: '' });
    assert.equal(T.senderOf({ direction: 'incoming', content: {} }, conv).name, 'Himanshu Singh');
    assert.equal(T.senderOf({ direction: 'incoming', content: { participantEmail: 'ravi@x.io' } }, {}).name, 'ravi');
    assert.equal(T.recipientLine({ direction: 'incoming', content: {} }, conv), 'to me');
    assert.equal(T.recipientLine({ direction: 'outgoing', content: {} }, conv), 'to Himanshu Singh');
    assert.equal(T.recipientLine({ direction: 'incoming', content: { cc: [{ name: 'A' }, { address: 'b@x.io' }, { name: 'C' }, { name: 'D' }] } }, conv), 'to me · cc: A, b@x.io, C, +1 more');
  });
});

describe('rendering', () => {
  it('a short thread renders one card per message, full width capped at 860px, no chat-bubble tails', () => {
    const out = html(thread(3));
    assert.equal((out.match(/<article/g) || []).length, 3);
    assert.match(out, /max-w-\[860px\]/);
    assert.doesNotMatch(out, /rotate-45/); // the bubble tail
  });

  it('sender, address, recipients and date are in the header; Reply / Star / Delete are always present', () => {
    const out = html([mail()]);
    assert.match(out, /Himanshu Singh/);
    assert.match(out, /&lt;himanshu@gmail\.com&gt;/);
    assert.match(out, /to me/);
    assert.match(out, /aria-label="Reply to this message"/);
    assert.match(out, /aria-label="Star message"/);
    assert.match(out, /aria-label="Delete message"/);
  });

  it('sent mail gets the green left edge, received a neutral one, failed a red one with a banner', () => {
    assert.match(html([mail({ direction: 'outgoing' })]), /border-l-\[#1F8A5E\]/);
    assert.match(html([mail()]), /border-l-slate-300/);
    const failed = html([mail({ direction: 'outgoing', status: 'failed' })]);
    assert.match(failed, /border-l-red-500/);
    assert.match(failed, /Not delivered/);
  });

  it('the subject is not repeated on every card, only when it changed', () => {
    const out = html([mail({ subject: 'Retest' }), mail({ subject: 'Re: Retest' }), mail({ subject: 'Something else' })]);
    assert.equal((out.match(/Something else/g) || []).length, 1);
    assert.equal((out.match(/>Retest</g) || []).length, 0);
  });

  it('a long thread renders collapsed one-line rows for old messages and a "Show all" link', () => {
    const msgs = thread(7);
    const out = html(msgs);
    assert.equal((out.match(/<article/g) || []).length, 1); // only the newest is open
    assert.equal((out.match(/aria-expanded="false"/g) || []).length, 6);
    assert.match(out, /Show all 7 messages/);
    assert.ok(out.includes(msgs[0].content.body), 'the snippet of an old message is visible on its collapsed row');
  });

  it('quoted history is folded behind a toggle and the new text is shown', () => {
    const out = html([mail({ content: { body: 'Thanks, will do.\n\nOn Mon, 7 Sep 2026, X wrote:\n> the old message' } })]);
    assert.match(out, /Thanks, will do\./);
    assert.match(out, /title="Show quoted history"/);
    assert.doesNotMatch(out, /the old message/);
  });

  it('attachments render as cards at the bottom', () => {
    const out = html([mail({ content: { attachments: [{ url: 'https://x/f.pdf', fileName: 'Offer Letter.pdf', mimeType: 'application/pdf', size: 1024 }] } })]);
    assert.match(out, /Offer Letter\.pdf/);
  });

  it('rich HTML bodies sit on a white paper panel in dark mode (their own dark text would vanish on the dark card)', () => {
    const out = html([mail({ content: { html: '<p style="color:#222">Rich hello</p>' } })]);
    assert.match(out, /Rich hello/);
    assert.match(out, /dark:bg-white/);
  });

  it('internal notes keep their own compact row and are not drawn as cards', () => {
    const out = html([mail(), mail({ isInternal: true, type: 'text', content: { body: 'call him tomorrow' } })]);
    assert.equal((out.match(/<article/g) || []).length, 1);
    assert.match(out, /Internal note/);
    assert.match(out, /call him tomorrow/);
  });

  it('a card has dark-mode variants for its surface, border and text (no light-only colours)', () => {
    const out = render(React.createElement(EmailMessageCard, { message: mail(), conversation: conv, onAction: () => {} }));
    for (const cls of ['dark:bg-slate-900', 'dark:border-slate-800', 'dark:text-slate-100', 'dark:text-slate-200']) assert.ok(out.includes(cls), cls);
  });
});

describe('chat channels are unchanged', () => {
  it('WhatsApp messages still render as chat bubbles with the tail, in a MessageList with no email cards', async () => {
    const { default: MessageList } = await import('../app/automation/components/chat/MessageList.jsx');
    const wa = [
      { _id: 'w1', type: 'text', direction: 'incoming', channel: 'whatsapp', timestamp: new Date(2026, 8, 12, 10, 0).toISOString(), content: { body: 'Hi there' } },
      { _id: 'w2', type: 'text', direction: 'outgoing', channel: 'whatsapp', status: 'delivered', timestamp: new Date(2026, 8, 12, 10, 1).toISOString(), content: { body: 'Hello!' } },
    ];
    const out = render(React.createElement(MessageList, { messages: wa, conversation: { channel: 'whatsapp' }, onMessageAction: () => {} }));
    assert.match(out, /Hi there/);
    assert.match(out, /Hello!/);
    assert.match(out, /rotate-45/); // the bubble tail
    assert.doesNotMatch(out, /<article/);
    assert.match(out, /chat-wallpaper/);
  });

  it('an email conversation renders cards on the flat colour (no doodle wallpaper, no date pills)', async () => {
    const { default: MessageList } = await import('../app/automation/components/chat/MessageList.jsx');
    const out = render(React.createElement(MessageList, { messages: thread(2), conversation: { channel: 'email', participantName: 'Himanshu Singh', participantEmail: 'himanshu@gmail.com' }, onMessageAction: () => {} }));
    assert.equal((out.match(/<article/g) || []).length, 2);
    assert.doesNotMatch(out, /chat-wallpaper/);
    assert.doesNotMatch(out, /rotate-45/);
  });

  it('the bubble still folds quoted email history (the splitter moved to lib/omnichannel/emailThread.js)', async () => {
    const { default: MessageBubble } = await import('../app/automation/components/chat/MessageBubble.jsx');
    const out = render(React.createElement(MessageBubble, { message: mail({ content: { body: 'New text\n\nOn Mon, 7 Sep 2026, X wrote:\n> old' } }), conversation: conv }));
    assert.match(out, /New text/);
    assert.match(out, /title="Show quoted history"/);
    assert.doesNotMatch(out, />\s*old\s*</);
  });
});
