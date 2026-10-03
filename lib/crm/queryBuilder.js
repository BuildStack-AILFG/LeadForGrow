/**
 * Shared CRM query helpers for list endpoints.
 */

const MAX_SEARCH_LENGTH = 200;

/** Sort fields allowed on any CRM list endpoint (prevents field probing / operator injection). */
const DEFAULT_SORT_ALLOWLIST = [
  'createdAt', 'updatedAt', 'receivedAt', 'name', 'fullName', 'firstName', 'lastName',
  'email', 'status', 'priority', 'dueDate', 'amount', 'stage', 'score', 'lastContactedAt',
  'closeDate', 'title', 'companyName', 'industry', 'type',
];

/** Escape regex metacharacters so user input is matched literally. */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseListParams(searchParams, defaults = {}) {
  const rawPage = parseInt(searchParams.get('page') || defaults.page || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || defaults.limit || '50', 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 50;
  const skip = (page - 1) * limit;

  const requestedSort = searchParams.get('sort') || defaults.sortField || 'updatedAt';
  const allowlist = defaults.sortAllowlist || DEFAULT_SORT_ALLOWLIST;
  const sortField = allowlist.includes(requestedSort) ? requestedSort : (defaults.sortField || 'updatedAt');

  const sortDir = searchParams.get('dir') === 'asc' ? 1 : -1;
  const search = (searchParams.get('search')?.trim() || '').slice(0, MAX_SEARCH_LENGTH);
  const archived = searchParams.get('archived') === 'true';

  return { page, limit, skip, sortField, sortDir, search, archived };
}

export function buildSearchOr(fields, search) {
  if (!search) return null;
  const safe = escapeRegex(search.slice(0, MAX_SEARCH_LENGTH));
  return fields.map((field) => ({ [field]: { $regex: safe, $options: 'i' } }));
}

export function applyRoleFilter(query, user, assignedField = 'assignedTo') {
  const restricted = ['member', 'TEAM_MEMBER', 'VIEW_ONLY'].includes(user.role);
  if (restricted) {
    query[assignedField] = user._id;
  }
  return query;
}

export function paginationMeta(total, page, limit) {
  return { total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

export default { parseListParams, buildSearchOr, applyRoleFilter, paginationMeta, escapeRegex };
