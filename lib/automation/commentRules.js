/**
 * Shared (de)serialisation of comment-automation rules for the Instagram and
 * Facebook status routes, so both channels validate rules identically.
 */
import { effectiveScope } from '@/lib/automation/postScope';

const SCOPES = ['all', 'specific', 'next'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

/** Rule → the shape the settings UI consumes. */
export function serializeCommentRule(r) {
  return {
    id: r.id,
    name: r.name || '',
    keywords: r.keywords || [],
    matchType: r.matchType || 'contains',
    scope: effectiveScope(r),
    mediaId: r.mediaId || '',
    mediaThumb: r.mediaThumb || '',
    mediaCaption: r.mediaCaption || '',
    mediaPermalink: r.mediaPermalink || '',
    appliesFrom: r.appliesFrom || null,
    publicReply: r.publicReply || '',
    dmMessage: r.dmMessage || '',
    replyMode: r.replyMode || 'static',
    aiInstruction: r.aiInstruction || '',
    enabled: r.enabled !== false,
    triggeredCount: r.triggeredCount || 0,
  };
}

/**
 * Client rules → what we persist. `existing` is the stored list: it is the source of
 * truth for `appliesFrom` (a client can't backdate a 'next' rule) and for a 'next'
 * rule's attached post (a stale browser tab can't un-attach it).
 * A client re-arms a 'next' rule by sending `rearm: true`.
 */
export function sanitizeCommentRules(input, existing = []) {
  const prevById = new Map((existing || []).map((p) => [p.id, p]));

  return input.slice(0, 50).map((r) => {
    const id = r.id || `car_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const prev = prevById.get(id);
    const prevScope = prev ? effectiveScope(prev) : null;
    const scope = SCOPES.includes(r.scope) ? r.scope : (r.mediaId ? 'specific' : 'all');

    let mediaId = scope === 'all' ? '' : clip(r.mediaId, 200);
    let appliesFrom;
    if (scope === 'next') {
      if (r.rearm) {
        mediaId = '';
        appliesFrom = new Date();
      } else {
        if (!mediaId && prevScope === 'next') mediaId = prev.mediaId || '';
        appliesFrom = prevScope === 'next' && prev.appliesFrom ? prev.appliesFrom : new Date();
      }
    }

    // Preview (thumbnail/caption/link) only travels with the id it describes.
    const preview = (key) => {
      if (!mediaId) return '';
      if (clip(r.mediaId, 200) === mediaId && r[key]) return clip(r[key], key === 'mediaCaption' ? 200 : 1000);
      return prev?.mediaId === mediaId ? clip(prev[key], 1000) : '';
    };

    return {
      id,
      name: clip(r.name, 120),
      keywords: Array.isArray(r.keywords) ? r.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 20) : [],
      matchType: r.matchType === 'exact' ? 'exact' : 'contains',
      scope,
      mediaId,
      mediaThumb: preview('mediaThumb'),
      mediaCaption: preview('mediaCaption'),
      mediaPermalink: preview('mediaPermalink'),
      appliesFrom,
      publicReply: (r.publicReply || '').trim(),
      dmMessage: (r.dmMessage || '').trim(),
      replyMode: ['auto', 'ai', 'static'].includes(r.replyMode) ? r.replyMode : 'auto',
      aiInstruction: (r.aiInstruction || '').trim(),
      enabled: r.enabled !== false,
      triggeredCount: Number(r.triggeredCount) || 0,
      createdAt: r.createdAt || new Date(),
    };
  });
}

export default { serializeCommentRule, sanitizeCommentRules };
