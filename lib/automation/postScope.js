/**
 * Post scope for comment automations (Instagram + Facebook).
 *
 * A rule targets one of:
 *   'all'      — every post/reel, old and new
 *   'specific' — one chosen post/reel (rule.mediaId)
 *   'next'     — the next post/reel published after the rule was saved. Meta doesn't
 *                notify us when something is published, so the rule stores
 *                `appliesFrom` and attaches itself to the earliest post published at or
 *                after that moment the first time a matching comment arrives.
 *
 * Rules saved before scopes existed have no `scope`: a mediaId means 'specific',
 * no mediaId means 'all' — identical to their old behaviour.
 */
import Business from '@/models/Business';
import { listInstagramMedia } from '@/lib/instagram/send';
import { listFacebookPosts } from '@/lib/facebook/send';

const CHANNELS = {
  instagram: { path: 'integrationCredentials.instagram.commentAutomations', list: listInstagramMedia },
  facebook: { path: 'integrationCredentials.facebook.commentAutomations', list: listFacebookPosts },
};

export function effectiveScope(rule) {
  return rule?.scope || (rule?.mediaId ? 'specific' : 'all');
}

// Facebook post ids are "<pageId>_<postId>"; compare on the trailing part so a
// picker-supplied id and a webhook post_id always match.
const norm = (id) => String(id ?? '').split('_').pop();

// Instagram timestamps look like 2026-09-19T10:00:00+0000 (no colon in the offset).
function parseTs(ts) {
  if (!ts) return NaN;
  return Date.parse(String(ts).replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
}

/**
 * Should this rule fire for a comment on `event.mediaId`?
 * May call Meta once to attach an unbound 'next' rule to its post.
 */
export async function ruleAppliesToPost({ rule, event, business, channel }) {
  const scope = effectiveScope(rule);
  if (scope === 'all') return true;

  const eventPost = event?.mediaId;

  // Specific post, or a 'next' rule that has already attached to its post.
  if (rule.mediaId) return !!eventPost && norm(rule.mediaId) === norm(eventPost);

  // 'specific' with nothing chosen never fires — safer than silently going account-wide.
  if (scope !== 'next' || !rule.appliesFrom || !eventPost) return false;

  const cfg = CHANNELS[channel];
  if (!cfg) return false;

  const res = await cfg.list(business, { limit: 25 });
  if (!res.success) {
    console.error(`[${channel} comment automation] could not resolve "next post" — ${res.error}`);
    return false;
  }

  const from = new Date(rule.appliesFrom).getTime();
  const target = res.posts
    .filter((p) => parseTs(p.timestamp) >= from)
    .sort((a, b) => parseTs(a.timestamp) - parseTs(b.timestamp))[0];

  // Comment is on some other post (e.g. an older one, or a later upload) — not "the next post".
  if (!target || norm(target.id) !== norm(eventPost)) return false;

  try {
    await Business.updateOne(
      {
        _id: business._id,
        [cfg.path]: { $elemMatch: { id: rule.id, $or: [{ mediaId: { $exists: false } }, { mediaId: null }, { mediaId: '' }] } },
      },
      {
        $set: {
          [`${cfg.path}.$.mediaId`]: target.id,
          [`${cfg.path}.$.mediaThumb`]: target.thumbnail || '',
          [`${cfg.path}.$.mediaCaption`]: target.caption || '',
          [`${cfg.path}.$.mediaPermalink`]: target.permalink || '',
        },
      }
    );
  } catch (err) {
    console.error(`[${channel} comment automation] could not attach rule to next post:`, err.message);
  }
  rule.mediaId = target.id;
  return true;
}

export default { effectiveScope, ruleAppliesToPost };
