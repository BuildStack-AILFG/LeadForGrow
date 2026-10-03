/**
 * Best-match active nav resolution (DESIGN_BRIEF §7 "Active-state logic").
 *
 * Every nav item is scored against the current URL and ONLY the top scorer
 * is active — so two items can never light up together (the old per-item
 * `startsWith` check let /automation/leads?view=kanban activate both "Leads"
 * and "Lead Pipeline").
 *
 * An item matches through its `href` plus optional `match` prefixes (extra
 * routes it owns, e.g. Deals owns /automation/deals/[id]). Scores:
 *   exact path + every query param in the href matches   → 3000 + length
 *   exact path, href has no query                         → 2000 + length
 *   path is under a `match` prefix or the href path       → 1000 + length
 *   href has a query that doesn't match                   → no match
 * Longer paths win ties, so /automation/settings/ai beats /automation/settings.
 *
 * Pure, dependency-free — imported by the sidebar and by tests/nav.test.js.
 */

function splitHref(href) {
  const [path, query = ''] = String(href).split('?');
  return { path: path.replace(/\/+$/, '') || '/', params: new URLSearchParams(query) };
}

function getParam(searchParams, key) {
  if (!searchParams) return null;
  if (typeof searchParams.get === 'function') return searchParams.get(key);
  return searchParams[key] ?? null;
}

export function scoreNavItem(item, pathname, searchParams) {
  if (!item?.href) return 0;
  const current = String(pathname || '/').replace(/\/+$/, '') || '/';
  const { path, params } = splitHref(item.href);
  const hasQuery = [...params.keys()].length > 0;
  let best = 0;

  if (current === path) {
    if (hasQuery) {
      const allMatch = [...params.entries()].every(([k, v]) => getParam(searchParams, k) === v);
      if (allMatch) best = 3000 + path.length;
    } else {
      best = 2000 + path.length;
    }
  }

  if (!item.exact) {
    const prefixes = hasQuery ? item.match || [] : [path, ...(item.match || [])];
    for (const raw of prefixes) {
      const prefix = raw.replace(/\/+$/, '');
      if (current === prefix || current.startsWith(`${prefix}/`)) {
        best = Math.max(best, 1000 + prefix.length);
      }
    }
  }
  return best;
}

/**
 * @param items flat list of nav items ({ id, href, match?, exact? })
 * @returns id of the single active item, or null
 */
export function resolveActiveNavId(items, pathname, searchParams) {
  let bestId = null;
  let bestScore = 0;
  for (const item of items) {
    const s = scoreNavItem(item, pathname, searchParams);
    if (s > bestScore) {
      bestScore = s;
      bestId = item.id;
    }
  }
  return bestId;
}
