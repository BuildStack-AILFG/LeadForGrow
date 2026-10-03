import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveActiveNavId, scoreNavItem } from '../app/automation/components/layout/navMatch.js';
import { NAV_GROUPS, QUICK_LINK_IDS, getActiveNavId } from '../app/automation/components/layout/constants.js';

const items = NAV_GROUPS.flatMap((g) => g.items);
const active = (url) => {
  const [path, query = ''] = url.split('?');
  return getActiveNavId(NAV_GROUPS, path, new URLSearchParams(query));
};

describe('sidebar active state (best match, exactly one item)', () => {
  it('leads board view activates only Leads (the old bug lit up two items)', () => {
    assert.equal(active('/automation/leads?view=kanban'), 'leads');
  });

  it('leads list and lead record pages activate Leads', () => {
    assert.equal(active('/automation/leads'), 'leads');
    assert.equal(active('/automation/leads/abc123'), 'leads');
    assert.equal(active('/automation/leads/new'), 'leads');
  });

  it('Dashboard is exact — it does not swallow every /automation route', () => {
    assert.equal(active('/automation'), 'dashboard');
    assert.equal(active('/automation/'), 'dashboard');
    assert.equal(active('/automation/deals'), 'deals');
  });

  it('WhatsApp templates activate Templates (a tab inside Templates)', () => {
    assert.equal(active('/automation/whatsapp-templates'), 'templates');
  });

  it('longest prefix wins: AI settings beats Settings', () => {
    assert.equal(active('/automation/settings/ai'), 'ai-settings');
    assert.equal(active('/automation/settings/team-permissions'), 'crm-settings');
  });

  it('routes moved out of the nav still highlight their owner', () => {
    assert.equal(active('/automation/pipelines'), 'crm-settings');
  });

  it('nested routes keep their parent active', () => {
    assert.equal(active('/automation/whatsapp-flows/xyz'), 'whatsapp-flows');
    assert.equal(active('/automation/deals/42'), 'deals');
  });

  it('unknown routes activate nothing', () => {
    assert.equal(active('/somewhere-else'), null);
  });

  it('every nav item is defined exactly once (Quick links reuse ids)', () => {
    const ids = items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(items.map((i) => i.href)).size, items.length);
    for (const id of QUICK_LINK_IDS) assert.ok(ids.includes(id), `quick link ${id} exists`);
  });

  it('for every route in the nav, exactly one item scores highest', () => {
    for (const item of items) {
      const [path, q = ''] = item.href.split('?');
      const params = new URLSearchParams(q);
      const scores = items.map((i) => scoreNavItem(i, path, params));
      const top = Math.max(...scores);
      assert.equal(scores.filter((s) => s === top).length, 1, `tie at ${item.href}`);
      assert.equal(resolveActiveNavId(items, path, params), item.id);
    }
  });
});

describe('navMatch query handling', () => {
  const list = [
    { id: 'list', href: '/x' },
    { id: 'board', href: '/x?view=board' },
  ];
  it('exact query match beats bare path', () => {
    assert.equal(resolveActiveNavId(list, '/x', new URLSearchParams('view=board')), 'board');
  });
  it('non-matching query falls back to the bare item', () => {
    assert.equal(resolveActiveNavId(list, '/x', new URLSearchParams('view=table')), 'list');
  });
});
