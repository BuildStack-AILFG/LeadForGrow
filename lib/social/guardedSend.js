/**
 * Guarded Instagram/Facebook senders for AUTOMATED sends.
 *
 * Same names and signatures as lib/instagram/send.js and lib/facebook/send.js, so an
 * automation just imports from here instead. Every call is checked against the
 * warm-up limits / block cool-off (lib/social/sendSafety.js) before it goes to Meta,
 * and every result is fed back so a platform block pauses automation and alerts the
 * owner. A held-back send returns { success: false, kind: 'throttled', skipped: true }.
 *
 * Manual replies typed by a human in the inbox use the plain senders — they are not
 * limited (but their failures are still recorded via recordSendResult).
 */
import * as ig from '@/lib/instagram/send';
import * as fb from '@/lib/facebook/send';
import { allowAutomatedSend, recordSendResult } from '@/lib/social/sendSafety';

async function guarded(business, channel, kind, send) {
  const gate = await allowAutomatedSend(business, channel, kind);
  if (!gate.allowed) {
    return { success: false, error: gate.message, kind: 'throttled', reason: gate.reason, skipped: true };
  }
  const result = await send();
  await recordSendResult(business, channel, result);
  return result;
}

// Instagram — 'dm' = anything delivered to a person's inbox, 'reply' = public comment reply
export const sendInstagramMessage = (business, ...args) => guarded(business, 'instagram', 'dm', () => ig.sendInstagramMessage(business, ...args));
export const sendInstagramMedia = (business, ...args) => guarded(business, 'instagram', 'dm', () => ig.sendInstagramMedia(business, ...args));
export const sendInstagramPrivateReply = (business, ...args) => guarded(business, 'instagram', 'dm', () => ig.sendInstagramPrivateReply(business, ...args));
export const sendInstagramCommentReply = (business, ...args) => guarded(business, 'instagram', 'reply', () => ig.sendInstagramCommentReply(business, ...args));

// Facebook
export const sendMessengerMessage = (business, ...args) => guarded(business, 'facebook', 'dm', () => fb.sendMessengerMessage(business, ...args));
export const sendMessengerMedia = (business, ...args) => guarded(business, 'facebook', 'dm', () => fb.sendMessengerMedia(business, ...args));
export const sendFacebookPrivateReply = (business, ...args) => guarded(business, 'facebook', 'dm', () => fb.sendFacebookPrivateReply(business, ...args));
export const sendFacebookCommentReply = (business, ...args) => guarded(business, 'facebook', 'reply', () => fb.sendFacebookCommentReply(business, ...args));
