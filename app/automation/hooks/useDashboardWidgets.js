'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'lfg_dashboard_widgets_v1';

export const DASHBOARD_WIDGETS = [
  { key: 'kpis', label: 'KPI Cards' },
  { key: 'revenue', label: 'Revenue Chart' },
  { key: 'calendar', label: 'Calendar & Schedule' },
  { key: 'leadsManagement', label: 'Leads Management' },
  { key: 'retention', label: 'Retention Chart' },
  { key: 'needsAttention', label: 'Needs Attention' },
  { key: 'pipeline', label: 'Pipeline Breakdown' },
];

const DEFAULT_VISIBLE = DASHBOARD_WIDGETS.reduce((acc, w) => {
  acc[w.key] = true;
  return acc;
}, {});

function readStoredWidgets() {
  if (typeof window === 'undefined') return DEFAULT_VISIBLE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VISIBLE, ...parsed };
  } catch {
    return DEFAULT_VISIBLE;
  }
}

export function useDashboardWidgets() {
  const [visibleWidgets, setVisibleWidgets] = useState(readStoredWidgets);

  const toggleWidget = useCallback((key) => {
    setVisibleWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore write failures (private browsing, storage full, etc.)
      }
      return next;
    });
  }, []);

  return { visibleWidgets, toggleWidget };
}
