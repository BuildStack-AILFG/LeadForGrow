/**
 * Who may see which tasks.
 *
 * Owner, admin and manager see every task in the workspace. Agents (Sales Agent, Support and
 * any custom role named like an agent / sales / support role) see only tasks assigned to them.
 *
 * The role is resolved the same way as lib/access/resolver.js: the workspace owner is always
 * "owner"; otherwise the role picked in Team & Access (UserAccess.roleSlug); otherwise the
 * TeamMember / User role (admin → admin, manager → manager, everyone else → sales_agent).
 */
import mongoose from 'mongoose';
import UserAccess from '@/models/access/UserAccess';
import TeamMember from '@/models/automation/TeamMember';
import Business from '@/models/Business';

const SEE_ALL_ROLES = ['owner', 'admin', 'manager', 'super', 'super_admin', 'agency_owner', 'client_admin'];

/** Pure: does this role slug see only its own tasks? */
export function isOwnTasksOnlyRole(roleSlug) {
  const r = String(roleSlug || '').toLowerCase();
  if (!r) return true; // unknown role → least access
  if (SEE_ALL_ROLES.includes(r) || r.includes('admin') || r.includes('manager') || r.includes('owner')) return false;
  return true;
}

/** Pure: role slug from the stored records (mirrors lib/access/resolver.js). */
export function pickRoleSlug({ isOwner, accessRoleSlug, teamRole, userRole }) {
  if (isOwner) return 'owner';
  if (accessRoleSlug) return String(accessRoleSlug).toLowerCase();
  const r = String(teamRole || userRole || '').toLowerCase();
  if (r === 'owner') return 'owner';
  if (r.includes('admin')) return 'admin';
  if (r.includes('manager')) return 'manager';
  return 'sales_agent';
}

/**
 * Resolve the task scope for a signed-in user.
 * @returns {Promise<{ ownOnly: boolean, roleSlug: string, userId: mongoose.Types.ObjectId|null }>}
 */
export async function resolveTaskScope({ businessId, userId, userRole, ownerId }) {
  const uid = userId ? new mongoose.Types.ObjectId(String(userId)) : null;
  if (!uid) return { ownOnly: true, roleSlug: '', userId: null };
  const bid = new mongoose.Types.ObjectId(String(businessId));
  if (ownerId === undefined) {
    const biz = await Business.findById(bid).select('ownerId').lean();
    ownerId = biz?.ownerId;
  }
  const isOwner = String(userRole || '').toLowerCase() === 'owner' || (ownerId && String(ownerId) === String(uid));
  if (isOwner) return { ownOnly: false, roleSlug: 'owner', userId: uid };

  const [access, team] = await Promise.all([
    UserAccess.findOne({ businessId: bid, userId: uid }).select('roleSlug').lean(),
    TeamMember.findOne({ businessId: bid, userId: uid }).select('role').lean(),
  ]);
  const roleSlug = pickRoleSlug({
    isOwner: team?.role === 'owner',
    accessRoleSlug: access?.roleSlug,
    teamRole: team?.role,
    userRole,
  });
  return { ownOnly: isOwnTasksOnlyRole(roleSlug), roleSlug, userId: uid };
}

/** Extra Mongo filter for task queries: {} for managers, { assignedTo: me } for agents. */
export function taskOwnerFilter(scope) {
  return scope?.ownOnly ? { assignedTo: scope.userId } : {};
}

/** Scope from req.user (withAuth / withPlanAccess routes). */
export function resolveTaskScopeForUser(user) {
  return resolveTaskScope({ businessId: user.businessId, userId: user.userId, userRole: user.role, ownerId: undefined });
}

/** Scope from a resolveTenant() result. */
export function resolveTaskScopeForTenant(tenant) {
  return resolveTaskScope({
    businessId: tenant.business._id,
    userId: tenant.user._id,
    userRole: tenant.user.role,
    ownerId: tenant.business.ownerId,
  });
}
