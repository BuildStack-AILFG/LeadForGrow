'use client';

import { useEffect } from 'react';
import { useTour } from './TourProvider';

/**
 * Fires a spotlight tour the first time a user lands on a page, once its
 * target elements exist. Pass `ready = false` while the page is still
 * loading/skeletons are showing so the tour doesn't try to spotlight
 * elements that haven't rendered yet.
 */
export function useAutoStartTour(tour, ready = true) {
  const { start } = useTour();

  useEffect(() => {
    if (!ready || !tour) return;
    const t = setTimeout(() => start(tour), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tour?.id]);
}
