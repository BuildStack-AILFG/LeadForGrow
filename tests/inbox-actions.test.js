/**
 * Inbox row actions (Done, Assign to me), reopen-on-reply, ghost conversations, and the 1970 timestamp fix.
 * Run: node --test tests/inbox-actions.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let T, V, React, renderToStaticMarkup, Item;
before(async () => {
  T = await import('../lib/omnichannel/timestamps.js');
  V = await import('../lib/omnichannel/inboxViews.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Item } = await import('../app/automation/components/chat/ConversationItem.jsx'));
});

describe('normalizeTimestamp (seconds mistaken for milliseconds)', () => {
  it('reads a 1970 value as epoch seconds: the reported 1970-01-21 becomes 21 Aug 2026', () => {
    const bad = new Date('1970-01-21T16:28:58.366Z');
    const fixed = T.normalizeTimestamp(bad);
    assert.equal(fixed.toISOString(), '2026-08-21T18:52:46.000Z');
  });

  it('leaves real dates alone, including old ones and dates in 1970-early Jan', () => {
    for (const iso of ['2026-09-21T10:00:00.000Z', '2019-05-01T00:00:00.000Z', '2001-09-09T01:46:40.000Z']) {
      assert.equal(T.normalizeTimestamp(new Date(iso)).toISOString(), iso);
    }
    assert.equal(T.normalizeTimestamp(new Date(500_000_000)).getTime(), 500_000_000, 'below 1e9 ms is left alone');
  });

  it('accepts numbers and strings, and turns junk into "now"', () => {
    assert.equal(T.normalizeTimestamp(1787338366).toISOString(), '2026-08-21T18:52:46.000Z', 'a bare seconds number');
    const now = Date.now();
    const junk = T.normalizeTimestamp('not a date').getTime();
    assert.ok(junk >= now - 1000 && junk <= Date.now() + 1000);
    assert.ok(Math.abs(T.normalizeTimestamp(undefined).getTime() - Date.now()) < 1000);
  });
});

describe('Done reopens when the customer writes again (or the customer disappears from Needs reply)', () => {
  const svc = read('lib/omnichannel/conversationService.js');

  it('an incoming message reopens a closed conversation on both write paths, and only closed ones', () => {
    assert.ok(/export async function reopenIfClosed[\s\S]{0,260}status: 'closed'[\s\S]{0,120}\$set: \{ status: 'open' \}/.test(svc));
    assert.ok(svc.includes("if (direction === 'incoming' && incrementUnread) await reopenIfClosed(conversation._id);"), 'upsert path');
    assert.ok(svc.includes("if (direction === 'incoming' && !isInternal) await reopenIfClosed(conversation._id);"), 'existing-conversation path');
  });

  it('both writers normalise the timestamp first', () => {
    assert.equal((svc.match(/normalizeTimestamp\(rawTimestamp\)/g) || []).length, 2);
  });

  it('claiming from the inbox fills an EMPTY lead assignee only', () => {
    assert.ok(/Lead\.updateOne\(\s*\{ _id: conv\.leadId, businessId, \$or: \[\{ assignedTo: null \}, \{ assignedTo: \{ \$exists: false \} \}\] \}/.test(svc));
  });

  it('the PATCH route keeps closedAt in step with status', () => {
    const route = read('app/api/automation/inbox/conversations/[id]/route.js');
    assert.ok(route.includes("updates.status === 'closed'") && route.includes('closedAt = new Date()') && route.includes('$unset = { closedAt: 1 }'));
  });
});

describe('ghost conversations (their lead was deleted) never sit in a queue', () => {
  it('Needs reply and Taken over add a "lead still exists" clause when the id list is known', () => {
    const ids = ['l1', 'l2'];
    for (const view of ['needs_reply', 'taken_over']) {
      const { clauses } = V.viewClauses(view, { existingLeadIds: ids });
      assert.deepEqual(clauses.at(-1), { $or: [{ leadId: null }, { leadId: { $in: ids } }] }, view);
    }
    assert.equal(V.viewClauses('needs_reply', {}).clauses.length, 3, 'no list (very large business): no extra clause');
    assert.equal(V.viewClauses('mine', { existingLeadIds: ids }).clauses.length, 1, 'other views are unchanged');
  });
});

describe('row actions (rendered)', () => {
  const chat = (over = {}) => ({
    _id: 'c1', channel: 'whatsapp', status: 'open', lastMessageDirection: 'incoming', lastInboundAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(), lastMessagePreview: 'hello', leadId: { name: 'Riya', phone: '919811100000' }, ...over,
  });
  const html = (props) => renderToStaticMarkup(React.createElement(Item, { active: false, onClick() {}, ...props }));

  it('a conversation waiting on us gets a Done button that is not nested in the row button', () => {
    const out = html({ chat: chat(), onDone() {} });
    assert.ok(out.includes('data-row-action="done"') && out.includes('aria-label="Mark done"'));
    const rowButton = out.slice(out.indexOf('<button'), out.indexOf('</button>') + 9);
    assert.ok(!rowButton.includes('data-row-action'), 'no button inside a button');
  });

  it('no Done button when we replied last, when it is already closed, for a newsletter sender, or with no handler', () => {
    assert.ok(!html({ chat: chat({ lastMessageDirection: 'outgoing' }), onDone() {} }).includes('data-row-action'));
    assert.ok(!html({ chat: chat({ status: 'closed' }), onDone() {} }).includes('data-row-action'));
    assert.ok(!html({ chat: chat({ channel: 'email', participantEmail: 'newsletter@x.com' }), onDone() {} }).includes('data-row-action'));
    assert.ok(!html({ chat: chat() }).includes('data-row-action'));
  });

  it('Assign to me shows only when asked for (the Unassigned queue), next to Done', () => {
    const on = html({ chat: chat(), onDone() {}, onAssignToMe() {}, showAssignToMe: true });
    assert.ok(on.includes('data-row-action="assign"') && on.includes('Assign to me') && on.includes('data-row-action="done"'));
    assert.ok(!html({ chat: chat(), onDone() {}, onAssignToMe() {} }).includes('data-row-action="assign"'));
  });

  it('is dark-mode paired and always visible (no hover-only reveal)', () => {
    const out = html({ chat: chat(), onDone() {}, onAssignToMe() {}, showAssignToMe: true });
    assert.ok(out.includes('bg-white dark:bg-slate-900') && out.includes('border-slate-200 dark:border-slate-700'));
    assert.ok(!/opacity-0[^"]*group-hover/.test(out));
  });
});

describe('wiring', () => {
  it('the hook closes with an Undo, reopens on Undo, and claims for the current user', () => {
    const hook = read('app/automation/hooks/useChatInbox.js');
    assert.ok(hook.includes("setStatus('closed')") && hook.includes("showUndoToast('Marked done'") && hook.includes("setStatus('open')"));
    assert.ok(hook.includes('body: JSON.stringify({ claim: true })') && hook.includes("toast.success('Assigned to you')"));
    assert.ok(/markDone,\s*\n\s*assignToMe,/.test(hook), 'both are returned');
  });

  it('the list passes the actions down, and Assign to me only in the Unassigned queue', () => {
    const side = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.ok(side.includes('onDone={onMarkDone}') && side.includes('onAssignToMe={onAssignToMe}') && side.includes("showAssignToMe={filter === 'unassigned'}"));
    const page = read('app/automation/chat/page.js');
    assert.ok(page.includes('onMarkDone={inbox.markDone}') && page.includes('onAssignToMe={inbox.assignToMe}'));
  });
});
