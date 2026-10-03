# LeadForGrow — Master UI/UX Redesign Brief

> Paste this whole file to Claude (Claude Code with Chrome enabled works best), or drop it in the repo root as `DESIGN_BRIEF.md` and say: "Read DESIGN_BRIEF.md and execute it phase by phase."

---

## 0. Your role

You are a principal product designer and senior front-end engineer who has shipped interfaces at companies known for calm, precise, dense B2B software (the Linear / Attio / Stripe Dashboard / Shopify admin tier). You design in code. You care about hierarchy, spacing, alignment and states more than decoration.

Your job: take LeadForGrow, a working CRM built in Next.js (running at `http://localhost:3000/automation`), and make every screen look and feel like a mature, trustworthy, classic product. Not flashy. Not "AI-generated". Quiet, consistent, fast to scan, pleasant to use for eight hours a day.

You may use: the codebase, a terminal, Chrome (to open localhost and public websites and take screenshots), and any package already in the project. Ask before adding new dependencies, creating accounts on third-party sites, or changing business logic, API calls, routes or data models.

---

## 1. The product

LeadForGrow is a sales + communication + automation CRM (leads, deals, pipelines, inbox, WhatsApp, broadcasts, sequences, chatbot, forms, call recovery, bills). Users are sales reps, managers and business owners, many on laptops, often using WhatsApp-heavy workflows. They live in tables, kanban boards, an inbox and record pages.

Current sidebar (from the live app):

```
Quick Links:   Dashboard · Leads · Inbox
Overview       (collapsed group — inspect what's inside)
Sales:         Leads · Lead Pipeline (/leads?view=kanban) · Deals · Sales Pipeline · Companies · Contacts · Bills
Communication: Inbox · Broadcasts · Meetings · Templates · WhatsApp Templates · Call Recovery
Automation:    Automations (badge 6) · Sequences · WhatsApp Flows · Customer Journeys · Chatbot · Forms
Insights & AI  (group)
Workspace      (group)
Footer:        workspace switcher "LeadForGrow — Pro plan"
Header:        logo + name, notification bell (9+), collapse button
```

---

## 2. Problems already visible (fix all of these)

1. **Several items are "active" at once.** On `/automation/leads`, "Leads" (Quick Links), "Leads" (Sales) and "Lead Pipeline" are all filled dark green, while "Dashboard" shows a mint highlight. Cause is almost certainly prefix/`startsWith` route matching that ignores the `?view=` query param plus duplicated entries. There must be exactly one active item at a time.
2. **Three or four competing highlight styles**: solid dark-green fill, mint fill, pale-green group background, mid-green hover. Users can't tell active from hover from "group open".
3. **Duplicate destinations**: Leads and Inbox appear twice. Duplicates in navigation always read as unfinished.
4. **Rows are far too tall** (~60px per nav item). Mature apps use 28–34px. The sidebar currently needs scrolling to show seven groups.
5. **No hierarchy between group headers and items**: "Sales" looks the same size/weight as "Leads". Expanded groups get a tinted block background that adds noise.
6. **Views listed as pages**: "Lead Pipeline" is just Leads in board view; "Sales Pipeline" is Deals in board view. The best CRMs (Attio, Twenty, Pipedrive, HubSpot) put List / Board as a view switcher inside the page, not as separate nav items.
7. **Brand color conflict**: the logo mark is purple/indigo while the UI theme is green. Pick one brand accent (see §6) and flag the logo decision to the owner — don't silently redraw the logo.
8. **Heavy dark-green fills** on active items are the loudest thing on screen. The sidebar should be calmer than the content, not louder.

Assume the rest of the app has similar issues (inconsistent paddings, mixed radii, card soup, too many colors, bold text everywhere). Your audit in Phase 1 will confirm.

---

## 3. Phase 0 — Research before you touch code

Spend real effort here. Open these in Chrome (public marketing pages, product screenshots, changelogs, design-system docs — do not sign up for anything). For each one you visit, write 2–4 concrete observations into `docs/design/research.md` (e.g. "nav item height ~30px, active = subtle gray bg + darker text, no icon color change"). Aim for 40+ sources; don't skim.

**CRMs and relationship tools** — Attio, Folk, Twenty (open source; its GitHub and Figma are public), Pipedrive, Close, HubSpot (note its 2026 visual refresh: lighter theme, cleaner type, more spacing), Salesforce Lightning / SLDS 2, Copper, Affinity, Capsule, Clay, Streak, Monday CRM, Freshsales.

**Dense productivity apps** — Linear (read both "How we redesigned the Linear UI" and "Behind the latest design refresh" on linear.app — dimmer sidebar, smaller icons, muted inactive text, fewer colored icon backgrounds, softer separators), Notion, Airtable, Superhuman, Front, Missive, Intercom, Plain, Help Scout, Cal.com, Raycast.

**Admin / finance dashboards** — Stripe Dashboard and Stripe docs, Mercury, Ramp, Brex, Shopify admin, Paddle.

**Developer products** — Vercel (Geist), GitHub, Sentry, PostHog, Resend, Supabase, Retool, Railway, Clerk.

**Design systems (the rules behind the look)** — Shopify Polaris (navigation: group items into sections, sentence case), GitHub Primer, Atlassian Design System, IBM Carbon (data tables, density), Salesforce SLDS, Radix Colors (12-step scales), Microsoft Fluent 2, Material 3 (state layers for hover/pressed), Apple HIG, GOV.UK Design System (plain, honest, accessible forms).

Then write a **"Common patterns"** section at the end of `research.md`: what 80%+ of the admired products agree on (navigation, density, color usage, type, tables, record pages, empty states, motion). That list — not personal taste — drives the decisions below. Where your research contradicts something in this brief, say so and propose the change.

---

## 4. What "not vibe-coded" means here (hard rules)

The fastest way to look cheap in 2026 is to look like default AI output. Never ship any of these:

- Purple/indigo/blue gradients, gradient backgrounds, gradient text, glows, glassmorphism, neon accents.
- Every block in its own rounded card with the same `rgba(0,0,0,.1)` shadow ("card soup"). Use whitespace, alignment and hairline dividers to group; reserve cards for genuinely separate objects.
- One border radius on everything. Radius follows size: small for chips/inputs, medium for panels, larger only for modals.
- Rainbow icon tiles, colored icon backgrounds, a different accent color per section, status dots on everything.
- Emojis in UI chrome. Sparkle ✨ icons for AI. Exclamation marks in copy.
- Tracked-out ALL-CAPS eyebrow labels above headings; "WORD — fragment" labels; "A · B · C" metadata strings as decoration; arrows "→" appended to every button.
- Bold (700+) text as a hierarchy tool. Use size, color and 500/600 weight instead.
- Fade-and-slide-up entrance animations on every section; hover lift/scale on every card.
- Big-number KPI cards with gradient accents as the default dashboard.
- Huge padding that makes a CRM show 6 rows per screen.

The target feeling: **classic, calm, precise, quietly confident.** Think a well-made ledger, not a launch page.

---

## 5. Design principles (in priority order)

1. **Content is the loudest thing.** Navigation and chrome recede (slightly dimmer sidebar, muted inactive text). The user's data gets the contrast.
2. **One accent, used sparingly.** The brand color appears on the primary button, the active nav item, focus rings, links and selected states. Nowhere else by default.
3. **Density with breathing room.** Compact enough to work, never cramped. 4px grid, consistent rhythm.
4. **Every interactive element has every state**: default, hover, active/pressed, focus-visible, selected, disabled, loading. States differ by one variable at a time.
5. **Same thing, same look, everywhere.** Page headers, toolbars, tables, empty states, sheets — one pattern each, reused.
6. **Words are UI.** Sentence case, plain verbs, the same name for an action throughout a flow ("Create deal" → toast "Deal created").
7. **Accessible by default.** WCAG AA contrast, visible keyboard focus, `prefers-reduced-motion`, hit targets ≥ 32px (≥ 40px on touch).

---

## 6. Design tokens (starting point — refine with your research)

Implement as CSS variables in `globals.css` and map into Tailwind (and shadcn tokens if the project uses shadcn). Remove hard-coded hex values from components as you go.

### Color — light theme

```css
/* Neutrals: slightly green-tinted grays so the brand and neutrals feel related */
--bg-app:          #FFFFFF;   /* main content */
--bg-sidebar:      #F7F8F7;   /* a touch dimmer than content */
--bg-subtle:       #F3F5F4;   /* table header, hover rows, input bg if needed */
--bg-muted:        #ECEFED;   /* nav hover, pressed */
--border:          #E3E7E5;   /* default dividers, inputs */
--border-strong:   #CDD3D0;   /* input hover, focused containers */

--text-primary:    #18201C;
--text-secondary:  #4F5955;
--text-tertiary:   #808A85;   /* placeholders, metadata, section labels */
--text-disabled:   #A9B1AD;

/* Brand accent: deep, classic green (one hue, a few steps) */
--accent:          #1E6B4E;   /* primary buttons, links */
--accent-hover:    #185A41;
--accent-pressed:  #134A35;
--accent-subtle:   #E8F2EC;   /* selected row, active nav bg */
--accent-text:     #165A40;   /* text on accent-subtle */
--focus-ring:      #1E6B4E66;

/* Semantic (muted, not neon) — always pair color with text/icon, never color alone */
--success: #2F7A4F;  --success-subtle: #E7F3EC;
--warning: #A86A12;  --warning-subtle: #FBF1DF;
--danger:  #B4372F;  --danger-subtle:  #FBE9E7;
--info:    #2D5F8A;  --info-subtle:    #E6EEF6;
```

Provide a dark theme with the same token names (near-neutral dark grays, not pure black; accent lightened to stay AA on dark). Ship light as default; dark can follow once light is solid.

Pipeline stage colors: use a small, muted, ordered palette (6–8 desaturated hues) for stage chips only — never as large fills.

### Typography

- Family: **IBM Plex Sans** (classic, highly legible, excellent tabular numerals) loaded via `next/font`. If the owner prefers, Source Sans 3 is the alternative. Avoid falling back to the default Inter/system look without a reason written in `research.md`.
- Enable `font-variant-numeric: tabular-nums` for tables, money, counts, dates.
- Scale (px / line-height): 12/16 (meta), 13/18 (dense table, sidebar), 14/20 (body default), 16/24 (section titles), 20/28 (page title), 24/32 (rare, dashboard hero only).
- Weights: 400 body, 500 labels/nav/active, 600 titles. No 700+.
- Sentence case everywhere. Section labels in the sidebar are 12px, 500, `--text-tertiary` — not uppercase.

### Spacing, radius, elevation, motion

- Spacing: 4px base → 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Radius: 4 (badges, chips, checkboxes), 6 (buttons, inputs, nav items), 8 (popovers, cards, sheets), 12 (modals only).
- Elevation: flat surfaces use borders, not shadows. Shadows only for floating layers — menus/popovers (`0 4px 16px rgba(16,24,20,.08), 0 0 0 1px var(--border)`), modals slightly stronger.
- Motion: 120–180ms, `cubic-bezier(.2,0,0,1)`; only for state changes the user caused (open, expand, drag, toast). Respect `prefers-reduced-motion`.
- Icons: one library (keep Lucide if present), 16px in nav and buttons, 1.5px stroke, `currentColor`, never colored backgrounds.

---

## 7. App shell and sidebar specification

### Layout
- Sidebar 240px, collapsible to a 56px icon rail (tooltips on hover; remember the user's choice). Optional hover-to-peek when collapsed.
- Top of content area: page header per page (not a global gray bar). Global search / command palette on `⌘K` / `Ctrl K`, with a search button in the sidebar header.
- Content max-width only for forms and settings (~720px); tables and boards use full width.

### Sidebar items
- Height 32px, horizontal padding 8px, icon 16px, 8px gap, text 13–14px / 500.
- Inactive: `--text-secondary`, icon `--text-tertiary`.
- Hover: `--bg-muted` background, text `--text-primary`. No color change to green.
- **Active (exactly one item)**: `--accent-subtle` background, `--accent-text` text and icon, weight 500. No solid dark fill. Optional 2px left indicator — choose one treatment and use it everywhere.
- Group headers: 12px, 500, `--text-tertiary`, 28px tall, chevron on hover/right, 16px top spacing above each group. An expanded group gets **no** background tint.
- Badges (counts): 11–12px, `--text-tertiary` on `--bg-muted`, right-aligned. The notification bell may use `--danger` for unread only.
- Footer: workspace switcher (logo, name, plan) + user menu; settings live under Workspace.

### Active-state logic (code fix)
Compute the active item by **best match**, not `startsWith` on every item:
1. Build a flat list of nav items with their `href` (path + optional query).
2. Score each: exact path+query match > exact path match with matching `view` param > longest path-prefix match.
3. Mark only the top-scoring item active; mark its parent group as "contains active" (auto-expanded, but not tinted).
Write a small unit test for this (e.g. `/automation/leads?view=kanban` activates only the Leads item, with the Board view selected inside the page).

### Proposed information architecture (confirm with the owner before removing anything; never delete routes — only nav entries)

```
[Search ⌘K]
Home                      (/automation — dashboard)
Inbox                     (/automation/chat, unread count)
My tasks / Today          (only if the feature exists)

Sales
  Leads                   (List | Board switcher inside the page)
  Deals                   (List | Board switcher inside; replaces "Sales Pipeline")
  Contacts
  Companies
  Bills

Engage
  Broadcasts
  Meetings
  Templates               (tabs inside: Email · WhatsApp)
  Call recovery

Automate
  Automations
  Sequences
  WhatsApp flows
  Customer journeys
  Chatbot
  Forms

Insights
  Reports / AI items

(bottom)  Settings · Workspace switcher · Help
```

Replace the "Quick links" block with user-pinnable **Favorites** (star a view or record, shown at top) — the Attio / Linear / Notion pattern — or remove it. Investigate what "Overview" contains and fold it into Home or Insights. If Automations / Sequences / Flows / Journeys overlap heavily, write a short recommendation for the owner; don't merge features on your own.

---

## 8. Page patterns (build once, reuse everywhere)

### Page header
Title (20/600) left; optional one-line description in `--text-secondary`; actions right: at most **one** primary button, others secondary/ghost or in a "⋯" menu. Below it, an optional tab bar (underline style, 13–14px, 500 active).

### Toolbar (lists and boards)
Left: view switcher (List / Board, segmented control), saved views dropdown. Middle/left: filter chips ("Status is Open ×", "+ Filter"), sort. Right: search field, density toggle, column settings, export. Filters show as removable chips, not a giant filter panel.

### Data tables (Leads, Deals, Contacts, Companies, Bills, Broadcasts…)
- Row height 40px default, 32px compact (user toggle, remembered). Header 36px, `--bg-subtle`, 12–13px / 500 `--text-secondary`.
- Sticky header; first column (name) frozen on horizontal scroll; checkbox column for bulk actions.
- Horizontal hairline row dividers only; no zebra stripes, no vertical borders unless spreadsheet-like.
- Text left-aligned, numbers and money right-aligned with tabular numerals; dates in one consistent relative/absolute format.
- Owner shown as 20px avatar + name; status as a small chip (dot + text, muted colors).
- Row hover: `--bg-subtle`; row actions appear on hover at the right edge; whole row opens the record (side sheet or page — pick one per object, consistently).
- Bulk-selection bar appears in place of the toolbar showing "3 selected" + actions.
- Pagination or virtualized infinite scroll; skeleton rows while loading, never a centered spinner over an empty table.

### Kanban boards (Leads board, Deals board)
- Columns 280–300px, header shows stage name, count, and total value (deals). Muted stage color as a small dot, not a colored column.
- Cards: white, 1px border, radius 8, padding 12. Content: name (14/500), company/value (13, secondary), owner avatar + days-in-stage / next activity (12, tertiary). No shadows at rest; subtle shadow only while dragging. Max 3–4 lines.
- Clear drop indicator, keyboard-movable cards, "+ Add" at column bottom on hover.

### Record pages (Lead, Deal, Contact, Company)
Follow the Attio / HubSpot / Twenty layout:
- Header: name, key status chip, owner, primary actions (Call, WhatsApp, Email, ⋯).
- Left (≈320px): properties as label/value pairs, inline-editable on click, grouped with small section labels.
- Center: activity timeline (notes, messages, calls, emails, stage changes) with a composer on top; tabs for Activity / Notes / Tasks / Files.
- Right (optional, ≈300px): associations (company, contacts, deals), upcoming meetings.

### Inbox
Three panes: conversation list (avatar, name, channel icon, last message, time, unread dot) · thread · contact context panel. Message bubbles restrained (neutral for inbound, `--accent-subtle` for outbound), timestamps grouped, composer pinned with templates/quick replies.

### Builders (Automations, Sequences, WhatsApp flows, Journeys, Chatbot, Forms)
Canvas on a light dotted or plain `--bg-subtle` background; nodes are white with 1px borders, an icon, a title and a one-line summary; selected node gets the accent border; configuration opens in a right side panel. List pages for these use the standard table pattern with status (Active/Paused/Draft), last run, runs count.

### Dashboard (Home)
A calm overview, not a wall of KPI cards: a single row of 4–5 key metrics as plain numbers with small labels and a delta in muted semantic color; then 2–3 charts (one accent color + grays, no gradients, light gridlines, clear axes); then actionable lists ("Tasks due today", "Deals closing this week", "Unreplied conversations").

### Forms, sheets and modals
- Create/edit records in a right side sheet (480–560px); modals only for confirmations and short focused tasks.
- Labels above fields, single column, helper text in tertiary, inline validation on blur, errors that say what to do.
- Inputs 36px tall, radius 6, `--border`, hover `--border-strong`, focus ring 2px `--focus-ring`.
- Buttons: primary (accent fill, white text), secondary (white, border), ghost, destructive. Heights 32 (default) / 36 (large). Loading state keeps width.

### Feedback
- Toasts bottom-right, neutral surface, short past-tense message + optional Undo.
- Empty states: a small neutral icon, one sentence on what goes here, one primary action ("Import leads", "Create your first sequence"). No illustrations of cartoon people.
- Errors: what happened + how to fix, with retry.
- Skeletons that match the real layout.

---

## 9. Execution plan (work in phases, commit after each)

**Phase 0 — Research.** As in §3. Output: `docs/design/research.md`.

**Phase 1 — Audit.** Read `tailwind.config`, `globals.css`, `components/ui/*`, layout and sidebar files. List every route (from the app router and nav config). Open each in Chrome at 1440×900 and 390×844, screenshot it into `docs/design/before/`. Write `docs/design/audit.md`: per page, the top issues, and a global list (colors in use, font sizes in use, radii in use, shadow styles in use, duplicated components). Count distinct hex values and font sizes with grep — you'll use these numbers to prove improvement.

**Phase 2 — Tokens.** Implement §6 as CSS variables + Tailwind mapping. Do not restyle pages yet.

**Phase 3 — Primitives.** Button, Input, Select, Checkbox, Switch, Badge/Chip, Avatar, Tabs, SegmentedControl, Tooltip, DropdownMenu, Popover, Sheet, Dialog, Toast, Skeleton, EmptyState, PageHeader, Toolbar, DataTable, KanbanColumn/Card. Reuse existing component files where possible (shadcn/Radix if present). Each component gets all states from principle 4.

**Phase 4 — Shell and sidebar.** Implement §7 including the active-state fix and its test. Screenshot every nav state (default, hover, active, collapsed, group expanded).

**Phase 5 — Pages, in this order:** Leads (list + board) → Deals (list + board) → Contacts → Companies → Record pages → Inbox → Home dashboard → Communication pages → Automation list pages and builders → Insights → Workspace/settings → Bills. After each page: screenshot into `docs/design/after/`, compare to before, run the checklist in §10, fix, then move on.

**Phase 6 — Polish and QA.** Keyboard pass (tab through every page), contrast check, reduced-motion check, 390px mobile pass for sidebar (becomes a drawer), tables (horizontal scroll with frozen first column) and record pages (stacked). Re-run the hex/font-size count and report the reduction.

Rules while working:
- Change presentation, not behavior. If a fix needs a logic change (like active-state matching or moving "Lead Pipeline" into a view switcher), keep URLs working and explain the change in the commit message.
- No new dependencies without asking. Prefer what's installed.
- Small, reviewable commits: `design(tokens): …`, `design(sidebar): …`, `design(leads): …`.
- When unsure between two options, pick the one more common among the products in `research.md`, and note it.
- After every phase, post a short summary with before/after screenshots and anything that needs the owner's decision.

---

## 10. Self-review checklist (run on every screen)

- [ ] Exactly one primary button visible per view.
- [ ] Exactly one active nav item; hover, active and selected are visually distinct.
- [ ] Only token colors used; accent appears only on primary action, active/selected, links, focus.
- [ ] Text uses only the type scale; no weight above 600; sentence case.
- [ ] Spacing values are on the 4px grid; left edges align down the page.
- [ ] Radii follow the size rule; shadows only on floating layers.
- [ ] No gradients, glows, emojis, colored icon tiles, ALL-CAPS eyebrows, or card soup.
- [ ] Tables: sticky header, right-aligned numbers with tabular figures, hover actions, density toggle works.
- [ ] Loading (skeleton), empty, and error states exist and are useful.
- [ ] Keyboard focus is visible everywhere; contrast passes AA; reduced motion respected.
- [ ] Looks right at 1440px, 1280px and 390px.
- [ ] Squint test: the user's data is the most prominent thing on the screen, not the chrome.
- [ ] "Remove one accessory": before calling a screen done, delete one decorative element that isn't earning its place.

---

## 11. Decisions to raise with the owner (don't decide alone)

1. Logo is purple, product accent is green — recolor the logo mark, or move the accent toward the logo?
2. Approve the IA in §7 (merging Lead Pipeline → Leads board, Sales Pipeline → Deals board, WhatsApp Templates → Templates tab, Quick links → Favorites).
3. Overlap between Automations / Sequences / WhatsApp flows / Customer journeys — keep separate or consolidate later?
4. Typeface: IBM Plex Sans (recommended) or alternative.
5. Dark mode now or after light mode ships.

Start with Phase 0. Do not write UI code until `research.md` and `audit.md` exist.
