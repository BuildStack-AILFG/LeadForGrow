/**
 * Shared comment-rule matching for Instagram + Facebook.
 *
 * Used twice per comment: by the webhook handlers (to decide whether a comment
 * should become a lead at all) and by the automation runners (to pick the rule
 * that replies). Keeping it here means both always agree.
 */
import { ruleAppliesToPost } from '@/lib/automation/postScope';

export function textMatches(text, rule) {
  const haystack = (text || '').toLowerCase().trim();
  if (!haystack) return false;
  const keywords = (rule.keywords || []).map((k) => (k || '').toLowerCase().trim()).filter(Boolean);
  if (!keywords.length) return false;
  if (rule.matchType === 'exact') {
    return keywords.includes(haystack);
  }
  // 'contains' — whole-word-ish so "price" doesn't fire on "pricey"
  return keywords.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i').test(haystack);
  });
}

/** First enabled rule whose keyword AND post scope match this comment, else null. */
export async function findMatchingRule(business, event, channel) {
  const rules = business?.integrationCredentials?.[channel]?.commentAutomations || [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (!textMatches(event.text, rule)) continue;
    if (!(await ruleAppliesToPost({ rule, event, business, channel }))) continue;
    return rule;
  }
  return null;
}

/**
 * Which comments become leads:
 *   'matched' (default) — only comments that trigger one of the channel's automations
 *   'all'               — every comment from anyone (the original behaviour)
 */
export function commentLeadMode(business, channel) {
  return business?.integrationCredentials?.[channel]?.commentLeadMode === 'all' ? 'all' : 'matched';
}

export default { textMatches, findMatchingRule, commentLeadMode };
