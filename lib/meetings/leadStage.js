import { DEFAULT_LEAD_STAGES, LEGACY_LEAD_STATUS_MAP } from '../crm/leadPipelineStages.js';

const KEYS = new Set(DEFAULT_LEAD_STAGES.map((s) => s.key));
const BY_LABEL = Object.fromEntries(DEFAULT_LEAD_STAGES.map((s) => [s.label.toLowerCase(), s.key]));

/**
 * Turn a meeting type's "move lead to stage" setting into a valid lead
 * pipeline key. The setting used to be two free-text boxes (lead status /
 * pipeline stage), so stored values can be a key ("qualified"), a label
 * ("Qualified"), a legacy status ("interested", "demo scheduled") or junk.
 * Returns null when nothing usable is set — the lead's stage is then left alone.
 */
export function stageKeyFromRules(rules = {}) {
  for (const raw of [rules.leadStatusOnBook, rules.pipelineStageOnBook]) {
    const text = String(raw || '').trim().toLowerCase();
    if (!text) continue;
    const key = text.replace(/[\s-]+/g, '_');
    if (KEYS.has(key)) return key;
    if (BY_LABEL[text]) return BY_LABEL[text];
    if (LEGACY_LEAD_STATUS_MAP[key]) return LEGACY_LEAD_STATUS_MAP[key];
  }
  return null;
}

/** Stage options for the meeting setup dropdown. */
export const MEETING_STAGE_OPTIONS = DEFAULT_LEAD_STAGES.map(({ key, label }) => ({ key, label }));
