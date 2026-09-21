/**
 * Inbox queues (Needs reply / Mine / Unassigned / Taken over): role defaults, the Mongo clauses, the shared
 * "automated sender" rule, and the tabs (real render).
 * Run: node --test tests/inbox-views.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let V, A, C, React, renderToStaticMarkup, Tabs;
before(async () => {
  V = await import('../lib/omnichannel/inboxViews.js');
  A = await import('../lib/omnichannel/automatedSender.js');
  C = await import('../app/automation/components/chat/constants.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: Tabs } = await import('../app/automation/components/chat/InboxViewTabs.jsx'));
});

describe('who sees what first', () => {
  it('owners, admins and managers start on Needs reply; agents start on Mine', () => {
    for (const r of ['owner', 'Owner', 'admin', 'super_admin', 'agency_owner', 'sales_manager', 'account_admin']) {
      assert.equal(V.defaultInboxView(r), 'needs_reply', r);
    }
    for (const r of ['member', 'agent', 'sales', 'support', '', null, undefined]) {
      assert.equal(V.defaultInboxView(r), 'mine', String(r));
    }
  });
});

describe('view clauses', () => {
  it('Needs reply: customer wrote last, conversation open, not a newsletter, longest wait first', () => {
    const { clauses, sort } = V.viewClauses('needs_reply', { userId: 'u1' });
    assert.deepEqual(clauses[0], { status: { $nin: ['closed', 'spam', 'archived'] } });
    assert.deepEqual(clauses[1], { lastMessageDirection: 'incoming' });
    assert.ok(clauses[2].participantEmail.$not instanceof RegExp);
    assert.deepEqual(sort, { lastMessageAt: 1 });
  });

  it('Mine: the conversation assignee, else the lead assignee', () => {
    const { clauses } = V.viewClauses('mine', { userId: 'u1', myLeadIds: ['l1', 'l2'] });
    assert.deepEqual(clauses, [{ $or: [{ assignedTo: 'u1' }, { assignedTo: null, leadId: { $in: ['l1', 'l2'] } }] }]);
  });

  it('Unassigned: no conversation assignee AND (no lead, or a lead nobody owns)', () => {
    const { clauses } = V.viewClauses('unassigned', { userId: 'u1', unassignedLeadIds: ['l9'] });
    assert.deepEqual(clauses, [{ assignedTo: null }, { $or: [{ leadId: null }, { leadId: { $in: ['l9'] } }] }]);
  });

  it('Taken over = a human intervened; unknown views add nothing', () => {
    assert.deepEqual(V.viewClauses('taken_over', {}).clauses, [{ inboxStatus: 'intervened' }]);
    assert.deepEqual(V.viewClauses('all', {}).clauses, []);
    assert.deepEqual(V.viewClauses('whatever', {}).clauses, []);
  });

  it('only the views that need lead lists load them', () => {
    assert.deepEqual(V.leadListsNeeded('mine'), { mine: true, unassigned: false, existing: false });
    assert.deepEqual(V.leadListsNeeded('unassigned'), { mine: false, unassigned: true, existing: false });
    assert.deepEqual(V.leadListsNeeded('needs_reply'), { mine: false, unassigned: false, existing: true });
    assert.deepEqual(V.leadListsNeeded('all'), { mine: false, unassigned: false, existing: false });
  });
});

describe('the Mongo "automated sender" regex agrees with the JS rule (one rule, two places)', () => {
  const addresses = [
    'no-reply@company.com', 'noreply@x.io', 'do-not-reply@x.io', 'mailer-daemon@googlemail.com', 'postmaster@x.com', 'bounces@x.com',
    'notifications@github.com', 'notifications+abc@slack.com', 'newsletter@x.com', 'news@x.com', 'updates2@x.com', 'digest@x.com', 'marketing@x.com',
    'hello@em.clickup.com', 'x@click.email.slackhq.com', 'a@mail.notion.so', 'a@news.company.com',
    // real people / prospects: must NOT match
    'support@company.com', 'sales@company.com', 'hello@company.com', 'team@company.com', 'info@company.com', 'news.reporter@paper.com',
    'himanshu@gmail.com', 'priya.singh@outlook.com', 'contact@emerald.com', 'a@email-marketing-agency.com.au'.replace('email-', 'x-'),
  ];
  it('matches exactly the same addresses', () => {
    const re = new RegExp(A.automatedAddressRegexSource(), 'i');
    for (const email of addresses) {
      assert.equal(re.test(email), A.isAutomatedSender({ channel: 'email', email }), email);
    }
  });
});

describe('view definitions', () => {
  it('four primary tabs (queues + All), everything else under More, no duplicate ids', () => {
    assert.deepEqual(C.INBOX_PRIMARY_VIEWS.map((v) => v.id), ['needs_reply', 'mine', 'unassigned', 'all']);
    const ids = C.INBOX_FILTERS.map((v) => v.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const v of V.SERVER_VIEWS) assert.ok(ids.includes(v), v);
  });
  it('every view says what an empty list means (an empty queue is good news)', () => {
    for (const v of C.INBOX_FILTERS) assert.ok(v.empty && v.hint, v.id);
  });
  it('the old jargon is gone: no "Live", no bare "Assigned"', () => {
    const labels = C.INBOX_FILTERS.map((v) => v.label);
    assert.ok(!labels.includes('Live') && !labels.includes('Assigned') && !labels.includes('Automated'));
  });
});

describe('InboxViewTabs render', () => {
  const html = (props) => renderToStaticMarkup(React.createElement(Tabs, { filter: 'needs_reply', onChange() {}, counts: null, ...props }));

  it('shows the four tabs and a More button, wrapping instead of scrolling sideways', () => {
    const out = html();
    for (const label of ['Needs reply', 'Mine', 'Unassigned', 'All', 'More']) assert.ok(out.includes(label), label);
    assert.ok(out.includes('flex-wrap') && !out.includes('overflow-x-auto'));
  });

  it('shows counts on the queues, capped at 99+, and nothing for zero', () => {
    const out = html({ counts: { needs_reply: 12, mine: 0, unassigned: 250, taken_over: 3, unread: 5 } });
    assert.ok(/data-count="needs_reply"[^>]*>12</.test(out));
    assert.ok(/data-count="unassigned"[^>]*>99\+</.test(out));
    assert.ok(!out.includes('data-count="mine"'), 'zero shows no badge');
  });

  it('an active secondary view replaces the "More" label and keeps its count', () => {
    const out = html({ filter: 'taken_over', counts: { taken_over: 3 } });
    assert.ok(out.includes('Taken over'));
    assert.ok(/data-count="taken_over"[^>]*>3</.test(out));
    assert.ok(!out.includes('>More<'));
  });

  it('marks the active tab and is dark-mode paired', () => {
    const out = html({ filter: 'mine' });
    assert.ok(/aria-pressed="true"[^>]*class="[^"]*bg-brand text-white/.test(out) || /class="[^"]*bg-brand text-white[^"]*"[^>]*>Mine/.test(out) || out.includes('bg-brand text-white'));
    assert.ok(out.includes('bg-slate-100 dark:bg-slate-800'));
  });
});

describe('wiring', () => {
  it('the list route applies ?view= with the same rules as the counts route', () => {
    const list = read('app/api/automation/inbox/conversations/route.js');
    assert.ok(list.includes("searchParams.get('view')") && list.includes('viewClauses(view, inputs)') && list.includes('.sort(sortOrder)'));
    const counts = read('app/api/automation/inbox/counts/route.js');
    assert.ok(counts.includes('countInboxQueues'));
    const q = read('lib/omnichannel/inboxViewQuery.js');
    assert.ok(q.includes('viewClauses(view, inputs)') && q.includes('SERVER_VIEWS.map'));
  });

  it('the hook sends the view, ignores it while searching, remembers the choice, defaults by role, and keeps counts fresh', () => {
    const hook = read('app/automation/hooks/useChatInbox.js');
    assert.ok(hook.includes("if (isServerView(filter)) { if (!search) params.set('view', filter); }"));
    assert.ok(hook.includes('defaultInboxView(role)') && hook.includes("'lfg_ui_inbox_view'"));
    assert.ok(hook.includes("authFetch('/api/automation/inbox/counts')"));
    assert.ok(hook.includes('requestId !== convRequestRef.current'), 'a stale list response must not overwrite a newer one');
    assert.ok(hook.includes("if (initialLeadId.current) { setFilterState('all'); return; }"), 'a deep link to a lead opens on All');
    assert.ok(!/filter === 'assigned'|filter === 'intervened'/.test(hook), 'the old client-side queue filters are gone');
  });

  it('the view preference survives logout like the other layout preferences', async () => {
    const { isDeviceLevelKey } = await import('../lib/clientStorage.js');
    assert.equal(isDeviceLevelKey('lfg_ui_inbox_view'), true);
  });

  it('the sidebar uses the tabs, gets the counts, and explains an empty queue', () => {
    const side = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.ok(side.includes('<InboxViewTabs') && side.includes('counts={viewCounts}') && side.includes('?.empty'));
    assert.ok(read('app/automation/chat/page.js').includes('viewCounts={inbox.viewCounts}'));
  });
});
