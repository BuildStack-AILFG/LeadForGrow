// Tiny className joiner — drops falsy values. No dependency needed.
export default function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

// Shared focus ring for every interactive primitive (DESIGN_BRIEF §8 forms).
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-canvas';
