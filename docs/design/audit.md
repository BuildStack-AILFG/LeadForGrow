# Phase 1 — Audit (code-level; screenshot pass pending)

Date: 2026-10-03. Scope: the signed-in app under `app/automation/**`.

**Status:** the code-level audit below is done. The screenshot pass (`docs/design/before/`, 1440×900 and 390×844 for every route) is **blocked**: every `/automation/*` route redirects to `/register?mode=login`, and Claude must not sign in with the owner's real credentials. It needs either a test account on the local DB, or the owner to sign in once in the automation browser window.

---

## 1. Stack facts that shape the plan

- Next.js 16.1.6 (App Router, Turbopack), React 19.2, **Tailwind v4** (CSS-first: `@import 'tailwindcss'` + `@theme inline` in `app/globals.css`; there is no `tailwind.config.*`).
- No shadcn, no Radix. Icons are `lucide-react` (good — one library). Toasts are `react-hot-toast`. `framer-motion` is installed and used for entrance animations.
- `app/components/ui/` has `Button`, `Input`, `Badge`, `Card`, `Heading`, `HelpHint`, `IntelligenceIcon`. **Button/Input/Badge/Card have 0 importers.** Every page hand-rolls its own buttons and inputs with literal Tailwind classes, which is the root cause of the inconsistency below.
- Fonts come from a Google Fonts `<link>` in `app/layout.js` loading **five families** (Barlow, Inter 400–900, Inter Tight, Libre Baskerville, Plus Jakarta Sans), not `next/font`. `body` is `bg-[#F8FAFC]` while `--background` is `#F5F6F8`, so they already disagree.
- Tests: `node --test tests/` (built-in runner, no Jest/Vitest). The nav active-state test can use it with no new dependency.

## 2. Global numbers (baseline to prove improvement)

| Metric | `app/**` | `app/automation/**` only |
|---|---|---|
| Distinct hex colours | **310** | **165** |
| Hex occurrences | 3,325 | — |
| Arbitrary font sizes `text-[Npx]` | — | **20 distinct** (7, 8, 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 22, 26, 28, 32) — 990 uses |
| Tailwind named sizes | — | 9 (xs → 5xl), 1,929 uses |
| Radius utilities | — | **15 variants**: rounded-lg 701, -xl 397, (4px) 359, -full 234, -2xl 152, -md 102, -none 50, -3xl 9, + corners |
| Shadow utilities | — | **25+ variants** incl. coloured shadows (indigo 11, teal 10, emerald 5, amber, violet, cyan, red) |
| Font weights | — | medium 802, semibold 630, **bold 220, black 9** |
| Colour families used | — | slate 6,289; teal 689; **emerald 666**; red 354; **indigo 354**; amber 289; **violet 198**; green 84; rose 68; purple 35; cyan 27; orange 26; sky 22; pink 17; blue/fuchsia/yellow/lime/gray |
| Files with gradients | — | 23 |
| `uppercase` occurrences | — | 223 |
| Files with `backdrop-blur` | — | 47 |
| Files importing `Sparkles` | — | 30 |
| Files containing emoji | — | 15 |

Reading: two competing greens (teal + emerald, roughly 50/50), plus a large indigo/violet residue from an earlier theme. Text sizes cluster at 10/11px, which is below the brief's 12px minimum. Radius is everything from 0 to 24px. Shadows are used on flat surfaces and are tinted.

## 3. Duplicated / parallel components

- Skeletons: 10 separate `*Skeleton*.jsx`; KPI card sets: 3 (`DealsKpiCards`, `ContactsKpiCards`, `CompaniesKpiCards`, all with gradients); headers: 18 `*Header*.jsx`; filter bars: 5; tables: 8; modals: 17; drawers: 6. Most of these are near-copies with different literal colours.
- `app/automation/components/Sidebar.js` is not a duplicate — it's the Suspense wrapper around `components/layout/Sidebar.jsx` (its fallback skeleton still uses old emerald colours).
- Two theme sources: `globals.css` `--primary #1D4B3E` vs `dashboard/premium/tokens.js` (`DASHBOARD_THEME`), plus literal hex everywhere.

## 4. Sidebar (from code — matches every problem in brief §2)

Files: `components/layout/{Sidebar,SidebarItem,SidebarSection,SidebarQuickLinks,SidebarHeader,WorkspaceSwitcher,constants}.jsx`.

1. **Multiple active items — root cause confirmed.** `isNavItemActive()` in `constants.js` scores each item independently:
   - On `/automation/leads?view=kanban`, the `leads` item has no query, skips its special case (which only fires when view ≠ kanban), and then hits the generic fallback `pathname === href` → **true**. `pipeline` also returns true. Two items in Sales are active.
   - Quick Links re-renders `dashboard`, `leads`, `inbox` from the same item objects, so any active item is shown active **twice**. On `/automation/leads?view=kanban` that's 3 solid-green rows.
2. **Four highlight styles**: active `bg-[#1D4B3E]` solid + white text; hover `bg-[#BAE0CF]`; open group `bg-[#F0F9F5]` panel; Quick Links `bg-[#F7FCFA]` panel. Plus the group-header hover `bg-[#F0F9F5]`, which is the same as the open-group tint.
3. **Duplicates**: Dashboard, Leads and Inbox appear in both Quick Links and their group.
4. **Row height**: `px-4 py-3` + 18px icon + 14px text ≈ **44–46px** per item (brief estimated ~60 including gaps). Target 32.
5. **No header/item hierarchy**: group headers use the same `text-[14px] font-medium px-4 py-3` and an icon, so they look exactly like items. Quick Links label is the opposite extreme: `10px bold uppercase tracking-wider #737DA5` (a blue-gray off-palette).
6. **Views as pages**: `Lead Pipeline` = `/automation/leads?view=kanban`; `Sales Pipeline` = `/automation/pipelines` (a separate route — need to check whether it's Deals-as-board or a pipeline *settings* page before folding it).
7. **Icons always brand-green** at rest (`text-[#1D4B3E]`), so every row carries accent colour, which breaks the "accent only for active" rule.
8. **Accordion opens nothing on load** (`openGroupId` starts `null`), so the group containing the active page is collapsed and the active item is hidden unless it's in Quick Links.
9. Width 260 / rail 72 (brief: 240 / 56). Rail hover-to-peek already exists and should be kept.
10. "Overview" group = `Dashboard` + `Tasks`. Proposal: Dashboard becomes top-level "Home"; Tasks becomes top-level "Tasks" (the feature exists).
11. Hover is JS-driven (`onMouseEnter`) on purpose — a prior session found `@media (hover: hover)` is false on the owner's touchscreen laptop. **Any new primitives must keep that in mind.** Plan: a global `hover-js` approach, or Tailwind v4 `@custom-variant hover (&:hover)` to drop the media-query gate app-wide. The second is a one-line fix that makes every `hover:` utility work on that device, and it also fixes the ~24 files a previous session flagged as broken.

## 5. Base styles in `globals.css` that conflict with the brief

- `h1`/`h2` forced to `font-bold` + Inter Tight; `.metric-value` 40px bold; `.small-label` 11px bold uppercase tracked. These are three of the brief's §4 "never ship" items, applied globally.
- `.ai-gradient-text` (indigo→purple→pink) and `.ai-card-border` gradient utilities.
- Tour/glass utilities (`.glass`, `.glass-panel`, `.glass-dark`) = glassmorphism.
- Dark theme only partially defined (7 vars).

## 6. Per-page issues (from code; to be confirmed visually)

| Page | Top issues seen in code |
|---|---|
| Dashboard `/automation` | Own token file (`premium/tokens.js`); KPI hero row; `rounded-none` everywhere from a prior "make it square" pass, which conflicts with the brief's radius-by-size rule. |
| Leads | Table header 14px semibold; row actions hover-reveal was made always-visible (touch bug); `#F8F9FA` page canvas; separate kanban via `?view=kanban`. |
| Deals / Contacts / Companies | Gradient KPI card rows; gradient skeletons; row menus portal-rendered (good, keep). |
| Inbox `/chat` | Bespoke WhatsApp font stack; outbound bubble solid `#1F8A5E` with white text (brief wants `--accent-subtle`); many dropdown variants. |
| Automations/Sequences/Forms | Gradient wizard headers; `Sparkles` decorations; coloured node tiles in sequence builder. |
| WhatsApp Flows builder | Recently restyled to Interakt; category accent bars + card-colour presets (user feature — keep the feature, mute the default palette). |
| Settings | `SettingsHub`/`SettingsLayoutClient` gradients; separate `SettingsSidebar`. |
| Call recovery, AI, Events, Reports | Gradients, `Sparkles`, indigo/violet leftovers. |

The full per-page table with screenshots is completed in the screenshot pass.

## 7. Implications for Phase 2+

- Tailwind v4 means the tokens go in `@theme inline` as `--color-*`, `--radius-*`, `--text-*`, `--shadow-*`, giving us utilities like `bg-bg-subtle`, `text-text-secondary`, `rounded-md` (6), `shadow-popover`.
- Because Button/Input/Badge already exist but are unused, Phase 3 rewrites them in place and then adopts them page by page.
- Loading 5 Google font families costs performance; switching the app to one `next/font` family (Plex) removes four network requests from the app shell (marketing pages keep theirs).

---

## 8. After Phases 2–6 (re-measured 2026-10-03)

| Metric (`app/automation/**`) | Before | After |
|---|---|---|
| Distinct hex colours | 165 | 127 (52 of them still as classes — WhatsApp-chat dark palette, channel brand colours, chart series; the rest are chart/stage data in JS) |
| Distinct arbitrary `text-[Npx]` sizes | 20 (990 uses) | 7 (42 uses) |
| `font-bold` / `font-black` | 229 | 5 |
| Radius variants in heavy use | 8 (lg 701, xl 397, 4px 359, full 234, 2xl 152, md 102, none 50, 3xl 9) | 4 by rule: lg (panels) 1073, md (buttons/inputs) 307, sm/4px 306, full (avatars/dots) 227; xl 20, 2xl 9 |
| Shadow variants | 25+ incl. coloured | 2 tokens in real use (`shadow-popover` 85, `shadow-modal` 59) + 29 stragglers |
| Files with gradients | 23 | 2 |
| `uppercase` eyebrow labels | 223 | 8 |
| Files with `backdrop-blur` | 47 | 0 |
| Sparkle icon for AI | 30 files | 0 (aliased to a neutral `Bot` icon) |
| Coloured icon tiles | ~36 | 0 accent tiles (semantic red/amber alert tiles kept) |
| Page `h1` styles | 25+ variants (18–30px) | 1 (`text-page font-semibold`, 20/600) |

Remaining colour-family utilities are almost entirely `dark:` overrides (dark mode is not the shipping target yet) plus modal scrims (`bg-slate-900/40`).

### Not done / not verified
- **Visual before/after screenshots**: owner declined the bulk screenshot step; most later visual checks were done through the DOM because the Chrome window was in the background (screenshot capture times out on a hidden tab).
- **390px mobile pass**: the drawer/table code paths are unchanged or built responsive, but not checked at phone width (window would not resize).
- **Structural rebuilds** were done for the shell, Leads, Deals, Contacts/Companies headers + metrics + tables, the lead record header, Settings hub and the dashboard surfaces. Inbox, record pages, builders (sequences/flows/chatbot/forms), Broadcasts, Meetings, Bills, Tasks, Reports were restyled through tokens/codemods only — their layouts are unchanged.
