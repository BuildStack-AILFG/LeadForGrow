'use client';

/**
 * Page-intro banners are switched off at the owner's request (2026-10-03,
 * re-applied after main's 0141a6a brought "green intro banners" back).
 * Kept as a no-op so every page that mounts <AutoPageIntro /> still works;
 * PageIntro.jsx and the registry (incl. iconImage/iconFullBleed) are
 * untouched if they're wanted again.
 */
export default function AutoPageIntro() {
  return null;
}
