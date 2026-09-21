/**
 * When should the marketing "Contact Us" popup open by itself?
 *
 * It used to open 10 s after page load — before the visitor had read anything, and on top of the cookie
 * banner. Now it waits until the visitor is actually engaged, and never stacks on other overlays.
 * Pure functions so the rules can be unit-tested (see tests/enquiry-popup.test.js).
 */

/** Seconds the tab must be VISIBLE (background tabs don't count) before the visitor counts as engaged. */
export const ENGAGED_AFTER_SECONDS = 45;

/** …or they scrolled this far down the page. */
export const ENGAGED_SCROLL_RATIO = 0.5;

/** Pages with less scrollable distance than this only use the time rule (else a short page = instantly "engaged"). */
export const MIN_SCROLLABLE_PX = 400;

export function hasScrolledEnough({ scrollY, viewportHeight, docHeight }) {
  const scrollable = docHeight - viewportHeight;
  if (!(scrollable > MIN_SCROLLABLE_PX)) return false;
  return scrollY / scrollable >= ENGAGED_SCROLL_RATIO;
}

/**
 * Auto-open only when ALL of these hold:
 *  - the visitor is engaged (time or scroll)
 *  - the cookie banner has been answered (never two overlays at once)
 *  - not on an app/auth/embedded page, not snoozed (dismissed 7d / submitted 30d) or already submitted
 *  - nothing else of ours is open, and we haven't already auto-opened on this page load
 *    (so closing it can never re-open it, even when storage is blocked and the snooze can't be saved)
 */
export function shouldAutoOpen({
  engaged, consentDecided, hidden, snoozed, isSubmitted, formOpen, menuOpen, alreadyAutoOpened,
}) {
  return Boolean(engaged) && Boolean(consentDecided) && !hidden && !snoozed && !isSubmitted
    && !formOpen && !menuOpen && !alreadyAutoOpened;
}

export default { hasScrolledEnough, shouldAutoOpen, ENGAGED_AFTER_SECONDS, ENGAGED_SCROLL_RATIO, MIN_SCROLLABLE_PX };
