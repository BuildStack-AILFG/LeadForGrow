'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TourOverlay from './TourOverlay';
import { isTourDone, setTourState } from './storage';

/**
 * Reusable product-tour engine (spec: "Build a reusable architecture...
 * ProductTour({ id, steps })"). One provider mounted at the app root
 * (see automation/layout.js); any page calls useTour().start(tourConfig)
 * to launch a spotlight walkthrough, or useAutoStartTour() to fire it
 * automatically the first time a user lands on that page.
 *
 * A step shape:
 *   { target: 'automation-create-btn', title, body, placement }
 * `target` matches a `data-tour="automation-create-btn"` attribute
 * somewhere on the page. If the target isn't found (element not rendered
 * yet, or removed), the step centers itself instead of crashing.
 */

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [active, setActive] = useState(null); // { id, label, steps, stepIndex }

  const start = useCallback((tour, { force = false } = {}) => {
    if (!tour?.id || !Array.isArray(tour.steps) || tour.steps.length === 0) return;
    if (!force && isTourDone(tour.id)) return;
    setActive({ ...tour, stepIndex: 0 });
  }, []);

  const restart = useCallback((tour) => start(tour, { force: true }), [start]);

  const next = useCallback(() => {
    setActive((cur) => {
      if (!cur) return cur;
      if (cur.stepIndex >= cur.steps.length - 1) {
        setTourState(cur.id, { completed: true, completedAt: Date.now() });
        return null;
      }
      return { ...cur, stepIndex: cur.stepIndex + 1 };
    });
  }, []);

  const back = useCallback(() => {
    setActive((cur) => (cur && cur.stepIndex > 0 ? { ...cur, stepIndex: cur.stepIndex - 1 } : cur));
  }, []);

  const skip = useCallback(() => {
    setActive((cur) => {
      if (cur) setTourState(cur.id, { skipped: true, skippedAt: Date.now() });
      return null;
    });
  }, []);

  const value = useMemo(() => ({ active, start, restart, next, back, skip }), [active, start, restart, next, back, skip]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && (
        <TourOverlay
          key={active.id}
          tour={active}
          onNext={next}
          onBack={back}
          onSkip={skip}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
