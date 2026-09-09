'use client';

/**
 * Flat localStorage-backed persistence for the onboarding system.
 * Deliberately simple (matches the rest of the app's localStorage usage —
 * see useSidebar.js, useLeadsWorkspace.js) rather than routed through the
 * backend: tour/intro completion is a per-browser UI preference, not
 * business data.
 */

const TOURS_KEY = 'lfg_tours_state_v1';
const INTRO_KEY = 'lfg_intro_seen_v1';
const GUIDE_PROGRESS_KEY = 'lfg_guide_progress_v1';
const GUIDE_RECENT_KEY = 'lfg_guide_recent_v1';

function safeGet(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / disabled — onboarding just won't persist, non-fatal
  }
}

export function getToursState() {
  return safeGet(TOURS_KEY, {});
}

export function setTourState(tourId, patch) {
  const state = getToursState();
  state[tourId] = { ...state[tourId], ...patch };
  safeSet(TOURS_KEY, state);
  return state;
}

export function isTourDone(tourId) {
  const state = getToursState();
  return Boolean(state[tourId]?.completed || state[tourId]?.skipped);
}

export function resetTour(tourId) {
  const state = getToursState();
  delete state[tourId];
  safeSet(TOURS_KEY, state);
}

export function resetAllTours() {
  safeSet(TOURS_KEY, {});
  safeSet(INTRO_KEY, {});
}

export function getIntrosSeen() {
  return safeGet(INTRO_KEY, {});
}

export function markIntroSeen(introId) {
  const seen = getIntrosSeen();
  seen[introId] = true;
  safeSet(INTRO_KEY, seen);
}

export function isIntroSeen(introId) {
  return Boolean(getIntrosSeen()[introId]);
}

// ── Guide (Help Center) progress ────────────────────────────────────────

export function getGuideProgress() {
  return safeGet(GUIDE_PROGRESS_KEY, { checklist: {} });
}

export function toggleChecklistItem(itemId) {
  const progress = getGuideProgress();
  progress.checklist = progress.checklist || {};
  progress.checklist[itemId] = !progress.checklist[itemId];
  safeSet(GUIDE_PROGRESS_KEY, progress);
  return progress;
}

export function getRecentGuides() {
  return safeGet(GUIDE_RECENT_KEY, []);
}

export function pushRecentGuide(slug) {
  const list = getRecentGuides().filter((s) => s !== slug);
  list.unshift(slug);
  const trimmed = list.slice(0, 5);
  safeSet(GUIDE_RECENT_KEY, trimmed);
  return trimmed;
}
