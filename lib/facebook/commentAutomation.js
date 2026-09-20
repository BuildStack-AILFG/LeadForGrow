import Business from '@/models/Business';
import { sendFacebookCommentReply, sendFacebookPrivateReply } from '@/lib/social/guardedSend';
import { pickVariant } from '@/lib/automation/messageVariation';
import { generateAutoReply } from '@/lib/ai/autoReply';
import { sendJitter } from '@/lib/automation/sendGuard';
import { findMatchingRule } from '@/lib/automation/commentMatch';

/**
 * Keyword-based comment automation for Facebook Page posts.
 *
 * Mirrors lib/instagram/commentAutomation.js. When a comment arrives on a Page
 * post, we check business.integrationCredentials.facebook.commentAutomations.
 * On a keyword match we:
 *   - post a public reply under the comment (rule.publicReply), and/or
 *   - send a private reply (DM) to the commenter (rule.dmMessage).
 *
 * A rule can target all posts, one chosen post, or the next post published
 * (see lib/automation/postScope.js). Called from processFacebookCommentEvent —
 * never throws into the webhook path. `prefetchedBusiness` avoids a re-read when
 * the handler has already loaded the business.
 */
export async function runFacebookCommentAutomations(businessId, event, prefetchedBusiness = null) {
  const business = prefetchedBusiness || await Business.findById(businessId);
  const fbCreds = business?.integrationCredentials?.facebook || {};
  const rules = fbCreds.commentAutomations || [];
  if (!rules.length) return { matched: 0 };
  const channelAi = !!fbCreds.aiReplyEnabled;

  // Ban-safety (warm-up limits, block cool-off) is enforced per send by lib/social/guardedSend.js.

  // First matching rule wins — avoid spamming the commenter.
  const rule = await findMatchingRule(business, event, 'facebook');
  if (!rule) return { matched: 0 };

  // Public reply is always static (short, warm ack) — varied so it isn't
  // identical bulk text.
  if (rule.publicReply && event.commentId) {
    try {
      await sendJitter();
      const res = await sendFacebookCommentReply(business, event.commentId, pickVariant(rule.publicReply));
      if (!res?.success) console.error('[FB comment automation] public reply rejected by Meta:', res?.error);
    } catch (err) {
      console.error('[FB comment automation] public reply failed:', err.message);
    }
  }

  // DM: AI when the rule forces it OR the rule follows the channel and the
  // channel's AI switch is on; otherwise static+varied.
  const mode = rule.replyMode || 'auto';
  const useAi = mode === 'ai' || (mode === 'auto' && channelAi);
  const wantsDm = useAi || !!rule.dmMessage;
  if (wantsDm && event.commentId) {
    let dmText = null;
    if (useAi) {
      dmText = await generateAutoReply({
        business,
        lead: { name: event.commenterName },
        channel: 'facebook',
        incomingText: event.text,
        instruction: rule.aiInstruction || rule.dmMessage || '',
        kind: 'dm',
      });
    }
    if (!dmText) dmText = pickVariant(rule.dmMessage); // fallback to static (varied)
    if (dmText) {
      try {
        await sendJitter();
        const res = await sendFacebookPrivateReply(business, event.commentId, dmText);
        if (!res?.success) console.error('[FB comment automation] private reply rejected by Meta:', res?.error);
      } catch (err) {
        console.error('[FB comment automation] private reply failed:', err.message);
      }
    }
  }

  try {
    await Business.updateOne(
      { _id: businessId, 'integrationCredentials.facebook.commentAutomations.id': rule.id },
      { $inc: { 'integrationCredentials.facebook.commentAutomations.$.triggeredCount': 1 } }
    );
  } catch { /* non-critical */ }

  return { matched: 1 };
}

export default { runFacebookCommentAutomations };
