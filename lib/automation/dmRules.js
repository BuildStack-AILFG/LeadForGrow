/**
 * Instagram DM auto-reply rules — validation, serialisation and matching (pure).
 *
 * A rule fires on a keyword (contains / exact, any of several) or on any message.
 * Keyword rules are checked first (most specific wins); an "any message" rule is the
 * fallback and only fires once per conversation per cool-down window.
 */
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export const DM_COOLDOWN_OPTIONS = [
  { minutes: 60, label: '1 hour' },
  { minutes: 360, label: '6 hours' },
  { minutes: 720, label: '12 hours' },
  { minutes: 1440, label: '24 hours' },
];

export function newDmRuleId() {
  return `dmr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function serializeDmRule(r) {
  return {
    id: r.id,
    name: r.name || '',
    trigger: r.trigger === 'any' ? 'any' : 'keyword',
    keywords: r.keywords || [],
    matchType: r.matchType === 'exact' ? 'exact' : 'contains',
    replyMode: r.replyMode === 'ai' ? 'ai' : 'static',
    message: r.message || '',
    aiInstruction: r.aiInstruction || '',
    cooldownMinutes: Number(r.cooldownMinutes) || 720,
    enabled: r.enabled !== false,
    triggeredCount: r.triggeredCount || 0,
    createdAt: r.createdAt || null,
    updatedAt: r.updatedAt || null,
  };
}

/** Client rule → stored rule. Returns { rule } or { error }. */
export function sanitizeDmRule(input = {}, prev = null) {
  const trigger = input.trigger === 'any' ? 'any' : 'keyword';
  const keywords = Array.isArray(input.keywords)
    ? [...new Set(input.keywords.map((k) => clip(k, 60)).filter(Boolean))].slice(0, 20)
    : [];
  const replyMode = input.replyMode === 'ai' ? 'ai' : 'static';
  const message = clip(input.message, 1000);
  const aiInstruction = clip(input.aiInstruction, 1000);

  if (trigger === 'keyword' && !keywords.length) return { error: 'Add at least one keyword, or choose "Any message".' };
  if (replyMode === 'static' && !message) return { error: 'Write the reply message.' };

  const cooldown = Number(input.cooldownMinutes);
  return {
    rule: {
      id: prev?.id || clip(input.id, 60) || newDmRuleId(),
      name: clip(input.name, 120),
      trigger,
      keywords: trigger === 'keyword' ? keywords : [],
      matchType: input.matchType === 'exact' ? 'exact' : 'contains',
      replyMode,
      message,
      aiInstruction,
      cooldownMinutes: Number.isFinite(cooldown) ? Math.min(Math.max(Math.round(cooldown), 15), 10080) : 720,
      enabled: input.enabled !== false,
      triggeredCount: prev?.triggeredCount || 0,
      createdAt: prev?.createdAt || new Date(),
      updatedAt: new Date(),
    },
  };
}

function textHasKeyword(text, keywords, matchType) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return false;
  return keywords.some((k) => {
    const kw = String(k || '').trim().toLowerCase();
    if (!kw) return false;
    if (matchType === 'exact') return t === kw;
    // whole-word-ish, same as comment rules: "price" doesn't fire on "pricey"
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i').test(t);
  });
}

/**
 * Which rule should answer this DM?
 * @param lastRepliedAt (ruleId) => Date|null — when this conversation last got an auto-reply from that rule
 */
export function findDmRule(rules = [], text = '', { now = new Date(), lastRepliedAt = () => null } = {}) {
  const active = rules.filter((r) => r && r.enabled !== false);
  const keyword = active.find((r) => r.trigger !== 'any' && textHasKeyword(text, r.keywords || [], r.matchType));
  if (keyword) return keyword;
  const any = active.find((r) => r.trigger === 'any');
  if (!any) return null;
  const last = lastRepliedAt(any.id);
  const gap = (Number(any.cooldownMinutes) || 720) * 60000;
  if (last && now - new Date(last) < gap) return null;
  return any;
}
