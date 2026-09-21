/**
 * Rules for when the marketing Contact Us popup may open by itself.
 * Run: node --test tests/enquiry-popup.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasScrolledEnough, shouldAutoOpen, ENGAGED_AFTER_SECONDS, ENGAGED_SCROLL_RATIO, MIN_SCROLLABLE_PX,
} from '../lib/enquiryPopup.js';

const base = {
  engaged: true, consentDecided: true, hidden: false, snoozed: false,
  isSubmitted: false, formOpen: false, menuOpen: false, alreadyAutoOpened: false,
};

describe('hasScrolledEnough', () => {
  const page = { viewportHeight: 800, docHeight: 4000 }; // 3200px scrollable

  it('is false at the top and true once past half of the scrollable distance', () => {
    assert.equal(hasScrolledEnough({ ...page, scrollY: 0 }), false);
    assert.equal(hasScrolledEnough({ ...page, scrollY: 1599 }), false);
    assert.equal(hasScrolledEnough({ ...page, scrollY: 1600 }), true);
    assert.equal(hasScrolledEnough({ ...page, scrollY: 3200 }), true);
  });

  it('a short page never counts as "scrolled" (only the time rule applies)', () => {
    // 1000px doc in an 800px viewport: only 200px scrollable, so scrolling to the end must not count
    assert.equal(hasScrolledEnough({ viewportHeight: 800, docHeight: 1000, scrollY: 200 }), false);
    // no scrollbar at all
    assert.equal(hasScrolledEnough({ viewportHeight: 800, docHeight: 800, scrollY: 0 }), false);
  });

  it('just above the minimum scrollable distance starts to count', () => {
    const docHeight = 800 + MIN_SCROLLABLE_PX + 1;
    assert.equal(hasScrolledEnough({ viewportHeight: 800, docHeight, scrollY: (MIN_SCROLLABLE_PX + 1) * ENGAGED_SCROLL_RATIO }), true);
  });

  it('tolerates junk values without throwing', () => {
    assert.equal(hasScrolledEnough({ scrollY: NaN, viewportHeight: 800, docHeight: 4000 }), false);
    assert.equal(hasScrolledEnough({ scrollY: 100, viewportHeight: undefined, docHeight: undefined }), false);
  });
});

describe('shouldAutoOpen', () => {
  it('opens when engaged, cookie banner answered, and nothing blocks it', () => {
    assert.equal(shouldAutoOpen(base), true);
  });

  it('does not open before the visitor is engaged (the old 10-second behaviour)', () => {
    assert.equal(shouldAutoOpen({ ...base, engaged: false }), false);
  });

  it('never stacks on the cookie banner', () => {
    assert.equal(shouldAutoOpen({ ...base, consentDecided: false }), false);
  });

  it('respects app/auth/embedded pages, snooze windows and a prior submission', () => {
    assert.equal(shouldAutoOpen({ ...base, hidden: true }), false);
    assert.equal(shouldAutoOpen({ ...base, snoozed: true }), false);
    assert.equal(shouldAutoOpen({ ...base, isSubmitted: true }), false);
  });

  it('does not open over another of our own overlays', () => {
    assert.equal(shouldAutoOpen({ ...base, formOpen: true }), false);
    assert.equal(shouldAutoOpen({ ...base, menuOpen: true }), false);
  });

  it('opens at most once per page load — closing it cannot re-open it even if the snooze could not be saved', () => {
    assert.equal(shouldAutoOpen({ ...base, alreadyAutoOpened: true, snoozed: false, formOpen: false }), false);
  });

  it('treats missing fields as "not allowed" rather than throwing', () => {
    assert.equal(shouldAutoOpen({}), false);
  });
});

describe('thresholds', () => {
  it('are the agreed values', () => {
    assert.equal(ENGAGED_AFTER_SECONDS, 45);
    assert.equal(ENGAGED_SCROLL_RATIO, 0.5);
  });
});
