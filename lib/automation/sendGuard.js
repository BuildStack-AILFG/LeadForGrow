/**
 * sendGuard — small helpers for automated outbound sends.
 *
 * sendJitter(): a random pause so replies don't all fire on the exact same
 * millisecond (looks human, spreads load).
 *
 * The rate limits themselves (warm-up ramp, block cool-off) live in
 * lib/social/sendSafety.js and are applied per send by lib/social/guardedSend.js.
 * (This file used to export withinSendLimit — a 600/hour Redis counter that counted
 * comments rather than sends and whose expiry reset on every hit; it was replaced.)
 *
 * Message *variation* (the other key spam signal) is handled by
 * lib/automation/messageVariation.js and lib/ai/autoReply.js.
 */

/** Resolve after a random delay in [minMs, maxMs]. */
export function sendJitter(minMs = 250, maxMs = 1200) {
  const ms = minMs + Math.floor(Math.random() * Math.max(1, maxMs - minMs));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default { sendJitter };
