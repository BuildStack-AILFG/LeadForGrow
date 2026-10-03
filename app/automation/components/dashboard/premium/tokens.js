// LeadForGrow premium dashboard design system.
// Single source of truth for colors, spacing, radius, shadow and typography.
// Brand primary is the app-wide teal (#1D4B3E) — same token used on the
// sidebar, leads table, chat inbox, templates, and tasks pages.

export const DASHBOARD_THEME = {
  // Surfaces
  bg: '#FFFFFF',
  card: '#FFFFFF',
  cardMuted: '#FAFBFB',

  // Text
  text: '#101828',
  textMuted: '#667085',
  textSubtle: '#98A2B3',

  // Lines
  border: '#E9ECEF',
  borderStrong: '#DDE2E6',

  // Brand — teal
  primary: '#1D4B3E',
  primaryHover: '#163c32',
  primaryStrong: '#12352c',
  accent: '#2F6B58',
  primaryBg: '#F0F9F5',
  primaryBorder: '#BAE0CF',
  primaryRing: 'rgba(29,75,62,0.14)',

  // Neutral dark (buttons / today marker)
  ink: '#101828',
  inkHover: '#1D2939',

  // Status — soft, never saturated
  success: '#1D4B3E',
  successText: '#163c32',
  successBg: '#F0F9F5',
  warning: '#D97706',
  warningText: '#B45309',
  warningBg: '#FFFBEB',
  danger: '#E5484D',
  dangerText: '#C0353A',
  dangerBg: '#FEF3F2',

  // Elevation — near-invisible, like the reference
  shadow: '0 1px 2px rgba(16,24,40,0.04)',
  shadowHover: '0 4px 14px rgba(16,24,40,0.07)',
  shadowPop: '0 12px 32px rgba(16,24,40,0.12), 0 4px 10px rgba(16,24,40,0.06)',

  radius: '14px',
  radiusInner: '12px',
  radiusSm: '10px',
};

// Chart palette — matches the teal brand primary above.
export const CHART = {
  line: '#1D4B3E',
  lineSoft: '#1D4B3E',
  gradTop: 'rgba(29,75,62,0.06)',
  gradBottom: 'rgba(29,75,62,0.06)',
  grid: '#EEF1F0',
  segments: ['#1D4B3E', '#2F6B58', '#8FC4AE'],
};

// Typography — premium SaaS: Inter, regular/medium only, no bold.
export const FONT = {
  pageTitle: 'text-hero sm:text-hero font-medium tracking-[-0.02em] text-fg leading-tight',
  sectionTitle: 'text-body font-medium tracking-[-0.01em] text-fg',
  cardTitle: 'text-dense font-medium text-fg',
  cardLabel: 'text-dense font-normal text-fg-secondary',
  metric: 'text-page font-medium text-fg leading-none tracking-[-0.02em] tabular-nums',
  metricSm: 'text-title font-medium text-fg leading-none tracking-[-0.02em] tabular-nums',
  sub: 'text-dense font-normal text-fg-tertiary',
  muted: 'text-dense font-normal text-fg-secondary',
};

// Shared class recipes so every widget shares one language.
export const UI = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 h-10 px-4 text-dense font-medium text-white bg-accent rounded-md transition-all duration-200 hover:bg-accent-hover hover:shadow-popover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
  btnDark:
    'inline-flex items-center justify-center gap-2 h-10 px-4 text-dense font-medium text-white bg-accent rounded-md transition-all duration-200 hover:bg-accent-hover hover:shadow-popover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101828]/30',
  btnGhost:
    'inline-flex items-center justify-center gap-2 h-10 px-3.5 text-dense font-medium text-fg-secondary bg-canvas border border-line rounded-md transition-all duration-200 hover:bg-subtle hover:border-line active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
  iconBtn:
    'inline-flex items-center justify-center w-10 h-10 text-fg-tertiary bg-canvas border border-line rounded-md transition-all duration-200 hover:bg-subtle hover:text-fg hover:border-line active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
};
