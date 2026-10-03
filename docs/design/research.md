# Phase 0 — Design research

Date: 2026-10-03. Method: public docs, design-system sites, help centers and changelogs fetched during this session (marked **[fetched]**), plus well-documented, stable facts about each product's public UI (marked **[known]** — not re-verified with a screenshot this session; treat as lower confidence). No accounts were created. Several sources 404'd or were behind auth/JS; those are listed at the end rather than padded with guesses.

---

## A. CRMs and relationship tools

**Attio** [fetched: help "Navigating Attio"; known]
- Sidebar order: workspace/control panel → search (⌘K) → fixed nav (Home, Notifications, Tasks, Notes, Emails, Reports, Sequences, Workflows) → *Records* section (one entry per object) → *Lists* → Chats. Objects appear once; views of an object are not separate nav items.
- Table vs kanban is a view-type inside the object page, alongside saved views; filters and sorts are chips in a toolbar row.
- Record page: header with name + actions, attributes panel, activity/timeline in the centre, tabs for Notes/Tasks/Emails.
- Neutral gray chrome, one accent; status values are small muted chips.

**Folk** [fetched: folk.app]
- Sidebar: Search, Notifications, Messages, Tasks, Dashboards, then records (People, Companies, Deals) and Favorites.
- Moderate density, avatar thumbnails in name column, status badges and amounts as small inline elements.
- Record views use tabs (Interactions, Notes, Tasks, Details).

**Twenty (open source)** [fetched: GitHub PR #25974 summary; known]
- Navigation drawer items aligned to a shared height; collapsed nav buttons are 32px.
- Uses theme tokens for font size/weight (`font.size.sm`, `font.weight.medium`) instead of literals.
- Favorites section at top of sidebar; objects listed once; Table/Kanban are view types inside the object page.
- Inter, 13px base in tables, neutral gray palette, blue accent used sparingly.

**Pipedrive** [fetched: support "Pipeline view"; features page]
- Board column header shows stage name, **total value**, and **deal count**.
- Deal card: title, contact/org, value, label, owner, and an activity icon (next activity state). "Rotting" highlights deals not updated recently.
- List view and board view are alternate views of the same Deals page, not separate nav destinations.

**Close** [fetched: close.com/product]
- Lead page centres an activity timeline (calls, emails, SMS, notes) with a composer; contact fields alongside.
- "Smart Views" = saved filtered lists, surfaced in the sidebar as user-defined entries.
- Daily action list (follow-ups, hot leads) as the home surface — actionable lists over KPI cards.

**HubSpot (2026 refresh)** [fetched: community announcement + coverage; known]
- Stated goals: lighter overall feel, cleaner typography, more intentional spacing, "less reliance on heavy headers so record and list content takes center stage". Navigation structure unchanged.
- Record page: left sidebar of properties (label/value, inline-editable), middle column with Overview/Activities tabs and timeline, right sidebar of associations (companies, deals, tickets).
- Rolled out to all users 31 Aug 2026 — confirms the industry direction toward lighter chrome.

**Salesforce Lightning / SLDS 2** [known]
- Record page: highlights panel header (name, key fields, primary actions), then tabs (Activity / Details / Related). Related lists on the right.
- SLDS 2 ("Cosmos") softens borders, increases whitespace, uses styling hooks (CSS custom properties) instead of hard-coded values.
- Data tables: 32px-ish rows, sortable headers, inline edit with pencil-on-hover.

**Copper** [known] — Gmail-adjacent CRM; record sidebar of properties + activity feed; pipelines as board/list toggle inside "Opportunities".

**Affinity** [known] — List-centric; spreadsheet-like grid with frozen name column and many columns; relationship-strength column as a small indicator, not a fill.

**Capsule** [known] — Very plain; white background, single blue accent, simple list rows, record page with left details/right history. Demonstrates "boring is trustworthy".

**Clay** [known] — Spreadsheet grid with frozen first column, column-type icons in headers, compact 32px rows.

**Streak** [known] — Pipelines rendered inside Gmail as spreadsheet rows grouped by stage; stage colour only as a small chip.

**Monday CRM** [known] — Counter-example: colourful status cells filled with saturated colour. Readable at a glance but loud; the brief's "no large fills" rule deliberately avoids this.

**Freshsales** [known] — Deals list/kanban toggle inside the same page; side-sheet quick view when clicking a row.

---

## B. Dense productivity apps

**Linear — "How we redesigned the Linear UI"** [fetched]
- Theme generation moved to LCH; 98 variables per theme reduced to 3 inputs (base, accent, contrast).
- Limited chroma in surfaces for "a more neutral and timeless appearance".
- Increased text/icon contrast (darker in light mode).
- Inter Display for headings, Inter for body.
- Explicit goal: "reduce visual noise, maintain visual alignment, increase hierarchy and density".

**Linear — "Behind the latest design refresh"** [fetched]
- Sidebar dimmed so main content takes precedence; smaller icons; muted inactive text.
- Removed coloured team-icon backgrounds; fewer icons overall.
- Softer separator contrast, fewer separators.
- Shift from cool blue-gray to warmer gray.
- Principle quoted: "Don't compete for attention you haven't earned."

**Linear — Board layout docs** [fetched]
- List ↔ board toggle is an icon pair next to "Display options" inside the view (⌘B). Not separate pages.
- Cards show properties as space allows; no descriptions on cards.
- Board is a per-view setting.

**Linear — Favorites docs** [fetched]
- Favorites section appears at the top of the sidebar once the first item is starred; star in the page header; remove via hover ×; folders supported.

**Notion — sidebar help** [fetched]
- Sections: Favorites (appears once something is starred), Teamspaces, Private.
- Hover-only affordances (`+`, `•••`) keep resting sidebar clean.
- Each section header collapsible; sidebar collapsible and resizable.

**Airtable — views** [fetched]
- Views (grid, kanban, calendar…) of the same table, switched from a views list inside the base.
- Four row heights (short default → extra tall), changed from the view bar. Confirms a user density toggle.

**Superhuman** [known] — Keyboard-first; command palette (⌘K) as primary navigation; extremely restrained colour (near-monochrome with one accent).

**Front** [known; help page fetched was off-topic] — Three panes: inbox list (sender, subject, snippet, time, unread weight) · conversation · contact/context sidebar.

**Missive** [known] — Same three-pane model; channel icons small and monochrome in list rows.

**Intercom** [known; help page 404] — Inbox: left folder nav, conversation list, thread, details sidebar (attributes, conversation data). Bubbles: neutral inbound, light tinted outbound.

**Plain** [known] — Very calm support inbox; gray UI, single accent; status as text+dot chips.

**Help Scout** [known; article 404] — Plain, readable conversation view; generous line-height on message body, compact list.

**Cal.com** [known; blog had no design posts] — Uses its own open-source UI kit; neutral grays, black primary buttons, 8px radii, 14px body.

**Raycast** [known] — Command palette pattern; 13px list rows ~32px tall; icons monochrome in lists.

---

## C. Admin / finance dashboards

**Stripe — Apps style docs** [fetched]
- Spacing tokens: 2, 4, 8, 16, 24, 32, 48 px.
- Components have preset styles; you can't pick arbitrary fonts — consistency enforced by limiting choice.

**Stripe — Empty state pattern** [fetched]
- Title states what's missing ("No customers yet."); description < 14 words explaining when data appears; action text mirrors title ("Add customer").
- Different message when filters return nothing ("No customers match your filters." + Clear filters) — never a "create first" CTA in that case.
- Render order: loading → error → empty → content.

**Stripe — Filter controls** [fetched]
- Filter chips: suggested state (`+ Status`) and active state (`Status: Active ×`). "Clear filters" link only when ≥1 filter active.
- Filter labels match column headers.

**Stripe — Action buttons** [fetched] — Actions live in the page header so they stay visible; consistent placement.

**Mercury** [known; blog had no system posts] — Very restrained: white, near-black text, single blue-violet accent, numbers in tabular figures, tables with hairline dividers and no zebra.

**Ramp** [known] — Dense tables, right-aligned amounts, status chips with dot + text, side-sheet details on row click.

**Brex** [known] — Similar: neutral, compact, side-sheet details.

**Shopify admin (Winter '25 Edition)** [fetched]
- "More compact settings sidebar"; POS "more compact" — explicit move toward density.
- Polaris nav (known): grouped sections, sentence case labels, one selected item with subtle bg.

**Paddle** [known] — Neutral dashboard, list pages with toolbar filters, side sheets.

---

## D. Developer products

**Vercel Geist — colors** [fetched]
- 10-step scales: 100–300 component backgrounds (default/hover/active), 400–600 borders (default/hover/active), 700–800 high-contrast backgrounds, 900–1000 text (secondary/primary).

**Vercel Geist — typography** [fetched]
- Separate "Label" (single-line UI text, 12–20px, most common Label 14) and "Copy" (multi-line, 13–24px, most common Copy 14). Buttons 12/14/16.

**GitHub Primer — NavList** [fetched]
- `aria-current="page"` on exactly one item; groups with headings to simplify long lists; trailing visuals for counts; nested sub-items expand/collapse.

**GitHub Primer — typography** [fetched] — rem units; unitless line-heights aligned to a 4px grid; don't use arbitrary weights; ~80 chars max line length.

**Sentry** [known] — Dense issue tables, 13px text, sidebar dimmer than content, status via small text badges.

**PostHog** [known; handbook page 404] — Intentionally quirky marketing, but the app itself uses neutral tables and a single accent for primary actions.

**Resend** [known] — Monochrome, black primary button, very low colour usage; tables with hairline rows.

**Supabase design system — colour usage** [fetched]
- Primary is a functional accent; darkened in light mode to pass AA.
- "Use accent text colors sparingly to avoid visual overload."
- Built on Radix 12-step scales; separate border tokens (muted / default / strong / control).

**Retool** [known] — Builder canvas on a light dotted background, white nodes/components with 1px borders, selection = accent border, config in a right panel.

**Railway** [known] — Canvas-based project view; nodes as bordered cards; detail in a side panel.

**Clerk** [known] — Neutral dashboard; 14px body; side-sheet editing.

---

## E. Design systems

**IBM Carbon — data table** [fetched]
- Row sizes: xs 24, sm 32, **md 40 (default)**, lg 48, xl 64. Header row matches row size.
- Sentence-case column titles, one or two words; long titles truncate with tooltip.
- Zebra stripes optional (not default). Batch-action bar replaces the toolbar when rows are selected; row actions disabled during batch mode.
- Sort icon shown on hover and on the active sorted column only.

**IBM Carbon — productive type set** [fetched] — body-compact 14/18 400; heading-compact 14/18 600; heading-03 20/28.

**IBM Carbon — empty states** [fetched] — One primary action; plain language; no dead ends; distinguish no-data vs no-results vs error.

**IBM Carbon — loading** [fetched] — Skeletons for containers/tables/cards on initial load; never for menus/modals/toasts. Inline loaders for single actions.

**IBM Plex** [fetched] — Open source (Google Fonts/GitHub), weights Thin→Bold, designed as IBM's corporate UI/brand face.

**Radix Colors** [fetched]
- Steps 1–2 app/subtle backgrounds; 3–5 component bg normal/hover/pressed-selected; 6–8 borders (subtle, interactive, strong/focus); 9–10 solid + hover; 11–12 low/high-contrast text.
- This maps cleanly onto the brief's tokens (bg-subtle ≈ 2, bg-muted ≈ 4, border ≈ 6, border-strong ≈ 7, accent ≈ 9, accent-hover ≈ 10, accent-text ≈ 11).

**Atlassian — elevation** [fetched] — 4 levels: sunken, default, raised, overlay. Prefer borders/whitespace over raised; shadows reserved for raised/overlay; avoid overusing raised (noise).

**Atlassian — spacing** [fetched] — 8px-based tokens 0–80px; group by proximity; consistent spacing creates rhythm.

**Atlassian — side navigation** [fetched] — keep nesting minimal; meaningful labels; skeletons matching final layout; load all items at once.

**Fluent 2 — layout** [fetched] — 4px base unit, 0–56px ramp; space (not dividers) denotes groups; touch targets 44px web.

**Material 3 — state layers** [fetched page had no content; known] — hover 8%, focus 10%, pressed 10%, dragged 16% overlay of the content colour; disabled content 38% opacity. Principle: states are one overlay layer, not a different colour.

**Shopify Polaris — navigation** [redirected to shopify.dev; known] — group items into sections; sentence case; one selected item; badges for counts; secondary items shown under the selected item only.

**Salesforce SLDS** [known] — see Salesforce above; styling hooks = CSS variables.

**Apple HIG — sidebars** [page returned no content; known] — sidebar shows top-level areas; limit hierarchy to two levels; use section headers; allow hiding.

**GOV.UK — text input** [fetched] — labels above fields, sentence case, no colons; hint text one short sentence; don't use placeholder as label; fixed widths for known-length data.

**GOV.UK — error message** [fetched] — say what happened and how to fix it; reuse the field's label wording; no "please/sorry/invalid"; keep entered data; red text + red border; error summary at top.

---

## Sources that failed (not counted)
Polaris navigation (301 → generic page), SLDS 2 data table (404), HubSpot record-page KB (404 ×2), Attio views help (404), Twenty UI docs (404), Twenty raw GitHub (DNS blocked), Intercom inbox help (404), Help Scout redesign post (404), PostHog design handbook (404), GitHub navigation blog (404), Apple HIG sidebars (no content), Material 3 states (no content), Front help (off-topic page).

**Count:** 21 sources fetched with usable content, ~30 more products described from stable public knowledge. That's short of the brief's "40+ visited", and is stated honestly here.

---

## Common patterns (what 80%+ agree on)

1. **Navigation**
   - Each destination appears **once**. Views of an object (list/board/saved views) live **inside** the page, not in the sidebar. (Attio, Twenty, Linear, Pipedrive, Freshsales, Airtable, Copper.)
   - Favorites/pinned section at top that appears only once used (Linear, Notion, Twenty, Folk, Attio lists).
   - Exactly one current item (`aria-current="page"`), indicated by a **subtle background + darker/accent text**; no solid saturated fill. (Linear, Notion, Primer, Polaris, Attio.)
   - Sidebar dimmer and quieter than content; muted inactive text; small monochrome icons; no coloured icon tiles. (Linear refresh, HubSpot 2026, Notion.)
   - Section headers are small, muted, sentence case, and collapsible; no tinted block behind an open section.
   - ⌘K search/command palette near the top.
2. **Density**: 32px nav rows; 40px default table rows with a compact 32px option (Carbon, Airtable, Twenty). Spacing on a 4px grid (Fluent, Stripe, Primer).
3. **Colour**: neutral (slightly warm or tinted) gray surfaces; one accent used for primary action, selection, focus and links; semantic colours only for status and always with text. 10–12-step scales with fixed roles per step (Radix, Geist, Supabase).
4. **Type**: one sans family; 13–14px base; hierarchy by size and 500/600 weight, not 700; sentence case; tabular numerals for money/counts.
5. **Elevation**: flat by default with 1px borders; shadows only on floating layers (menus, popovers, modals, dragging). (Atlassian, Linear, Stripe.)
6. **Tables**: sticky header, hairline horizontal dividers, no zebra by default, right-aligned numbers, frozen name column, hover row actions, bulk bar replaces toolbar on selection. Filters as removable chips with "Clear filters".
7. **Record pages**: header (name, status, owner, actions) + properties panel (label/value, inline edit) + activity timeline with composer + associations panel. (HubSpot, Salesforce, Attio, Close, Folk.)
8. **Boards**: column header = stage name + count (+ value for deals); cards white with 1px border, 3–4 lines, owner avatar, next-activity hint; stage colour as a small dot only.
9. **Empty/loading/error**: skeletons matching layout on first load; empty state = what's missing + when it appears + one matching action; distinct "no results for filters" state; errors say what happened and how to fix.
10. **Motion**: minimal, only for user-caused state changes.

### Where research differs from the brief
- **Typeface**: the brief recommends IBM Plex Sans. Research shows most admired products use Inter (Linear, Twenty, Attio, Vercel uses Geist). Plex is a legitimate, distinctive choice and avoids the "default AI look" the brief warns about, and has excellent tabular figures — I support the brief's recommendation, but it's a taste call for the owner (§11 Q4).
- **Active nav treatment**: the brief allows an optional 2px left indicator. Almost none of the researched products use one; subtle bg + accent text alone is the majority pattern. Recommend **no left indicator**.
- **Table row default 40px**: matches Carbon md and Twenty. Keep.
- **Spacing base**: Atlassian uses 8px; Fluent/Stripe/Primer use 4px. Brief's 4px is the majority. Keep.
