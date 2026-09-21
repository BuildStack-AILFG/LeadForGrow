import Business from '@/models/Business';
import { sendInstagramCommentReply, sendInstagramMessage, sendInstagramPrivateReply } from '@/lib/social/guardedSend';
import { pickVariant } from '@/lib/automation/messageVariation';
import { generateAutoReply } from '@/lib/ai/autoReply';
import { sendJitter } from '@/lib/automation/sendGuard';
import { findMatchingRule } from '@/lib/automation/commentMatch';

/**
 * Keyword-based comment automation.
 *
 * When a comment arrives on a post/reel, we check the business's configured
 * rules (business.integrationCredentials.instagram.commentAutomations). If the
 * comment text matches a rule's keyword, we:
 *   - post a public reply under the comment (rule.publicReply), and/or
 *   - DM the commenter (rule.dmMessage).
 *
 * A rule can target all posts, one chosen post, or the next post published
 * (see lib/automation/postScope.js). Called from processInstagramCommentEvent —
 * never throws into the webhook path.
 *
 * `prefetchedBusiness` lets the webhook handler pass the business it already
 * loaded (and already matched a rule against) instead of re-reading it.
 */
export async function runCommentAutomations(businessId, event, prefetchedBusiness = null) {
  const business = prefetchedBusiness || await Business.findById(businessId);
  const igCreds = business?.integrationCredentials?.instagram || {};
  const rules = igCreds.commentAutomations || [];
  if (!rules.length) return { matched: 0 };
  const channelAi = !!igCreds.aiReplyEnabled;

  // Ban-safety (warm-up limits, block cool-off) is enforced per send by lib/social/guardedSend.js.

  // First matching rule wins — avoids spamming the commenter with several
  // replies/DMs for one comment.
  const rule = await findMatchingRule(business, event, 'instagram');
  if (!rule) return { matched: 0 };

  // Public reply is always static (short ack) — varied so it isn't identical bulk text.
  if (rule.publicReply && event.commentId) {
    try {
      await sendJitter();
      const res = await sendInstagramCommentReply(business, event.commentId, pickVariant(rule.publicReply));
      if (!res?.success) console.error('[IG comment automation] public reply rejected by Meta:', res?.error);
    } catch (err) {
      console.error('[IG comment automation] public reply failed:', err.message);
    }
  }

  // DM: AI when the rule forces it OR follows the channel and the channel's
  // AI switch is on; otherwise static+varied.
  const mode = rule.replyMode || 'auto';
  const useAi = mode === 'ai' || (mode === 'auto' && channelAi);
  const wantsDm = useAi || !!rule.dmMessage;
  if (wantsDm && (event.commentId || event.commenterId)) {
    let dmText = null;
    if (useAi) {
      dmText = await generateAutoReply({
        business,
        lead: { name: event.commenterUsername ? `@${event.commenterUsername}` : '' },
        channel: 'instagram',
        incomingText: event.text,
        instruction: rule.aiInstruction || rule.dmMessage || '',
        kind: 'dm',
      });
    }
    if (!dmText) dmText = pickVariant(rule.dmMessage); // fallback to static (varied)
    if (dmText) {
      try {
        await sendJitter();
        // A commenter usually hasn't messaged us, so the DM must go out as a
        // private reply keyed to the comment. If Meta rejects that (already
        // replied to this comment, >7 days old), fall back to a plain DM, which
        // only succeeds inside the 24h window after the user's last message.
        let res = event.commentId
          ? await sendInstagramPrivateReply(business, event.commentId, dmText)
          : { success: false, error: 'no comment id' };
        if (!res.success) {
          console.error('[IG comment automation] private reply rejected by Meta:', res.error);
          if (event.commenterId && !res.skipped) {
            res = await sendInstagramMessage(business, event.commenterId, dmText);
            if (!res.success) console.error('[IG comment automation] fallback DM rejected by Meta:', res.error);
          }
        }
      } catch (err) {
        console.error('[IG comment automation] DM failed:', err.message);
      }
    }
  }

  // Best-effort usage counter so the UI can show how often a rule fired.
  try {
    await Business.updateOne(
      { _id: businessId, 'integrationCredentials.instagram.commentAutomations.id': rule.id },
      { $inc: { 'integrationCredentials.instagram.commentAutomations.$.triggeredCount': 1 } }
    );
  } catch { /* non-critical */ }

  return { matched: 1 };
}
