/**
 * Task visibility: agents (sales / support) see only their own tasks; owner, admin, manager see all.
 * Run: node --test tests/task-visibility.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import fs from 'node:fs';
import mongoose from 'mongoose';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

let V;
before(async () => {
  V = await import('../lib/crm/taskVisibility.js');
});

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('task visibility rules', () => {
  it('owner, admin and manager see every task', () => {
    for (const r of ['owner', 'admin', 'manager', 'super_admin', 'CLIENT_ADMIN', 'sales_manager']) {
      assert.equal(V.isOwnTasksOnlyRole(r), false, r);
    }
  });

  it('agents, sales, support, viewers and unknown roles see only their own', () => {
    for (const r of ['sales_agent', 'support', 'viewer', 'agent', 'sales', 'team_member', '', null]) {
      assert.equal(V.isOwnTasksOnlyRole(r), true, String(r));
    }
  });

  it('resolves the role like the access system', () => {
    assert.equal(V.pickRoleSlug({ isOwner: true, accessRoleSlug: 'sales_agent' }), 'owner');
    assert.equal(V.pickRoleSlug({ accessRoleSlug: 'Manager' }), 'manager');
    assert.equal(V.pickRoleSlug({ accessRoleSlug: 'support', teamRole: 'admin' }), 'support');
    assert.equal(V.pickRoleSlug({ teamRole: 'admin' }), 'admin');
    assert.equal(V.pickRoleSlug({ teamRole: 'team_member', userRole: 'team_member' }), 'sales_agent');
    assert.equal(V.pickRoleSlug({ userRole: 'TEAM_MEMBER' }), 'sales_agent');
  });

  it('builds the Mongo filter', () => {
    const id = new mongoose.Types.ObjectId();
    assert.deepEqual(V.taskOwnerFilter({ ownOnly: true, userId: id }), { assignedTo: id });
    assert.deepEqual(V.taskOwnerFilter({ ownOnly: false, userId: id }), {});
  });
});

describe('task visibility wiring', () => {
  it('task list, counts and create use the scope (old dead "member" check gone)', () => {
    const src = read('app/api/automation/tasks/route.js');
    assert.doesNotMatch(src, /role === 'member'/);
    assert.match(src, /scope\.ownOnly\) \{\s*query\.assignedTo = scope\.userId/);
    assert.match(src, /You can only create tasks assigned to yourself/);
    assert.match(src, /scope: \{ ownOnly: scope\.ownOnly \}/);
  });

  it('update and delete are limited to own tasks for agents', () => {
    const src = read('app/api/automation/tasks/[id]/route.js');
    assert.equal((src.match(/\.\.\.taskOwnerFilter\(scope\)/g) || []).length, 2);
  });

  it('dashboard, sidebar badge and entity task lists are filtered', () => {
    const dash = read('app/api/automation/dashboard/route.js');
    assert.equal((dash.match(/Task\.find\(\{ businessId, \.\.\.mine,/g) || []).length, 3);
    assert.match(read('app/api/automation/sidebar-stats/route.js'), /Task\.countDocuments\(\{ businessId, \.\.\.mine,/);
    for (const f of ['companies/[id]', 'contacts/[id]', 'deals/[id]', 'inbox/conversations/[id]']) {
      assert.match(read(`app/api/automation/${f}/route.js`), /Task\.find\(\{ businessId: [^}]*\.\.\.taskOwnerFilter\(/, f);
    }
  });

  it('the task form only offers the agent themselves', () => {
    const hook = read('app/automation/hooks/useTasksWorkspace.js');
    assert.match(hook, /teamMembers: assignableMembers/);
    assert.match(hook, /setOwnOnly\(!!data\.scope\?\.ownOnly\)/);
  });
});
