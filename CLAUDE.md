# CLAUDE.md — Change Log

This file is a running log of every change made in this repo by Claude Code, in reverse-chronological order (newest first). Every session must append an entry here before ending. See `DECISIONS.md` for the reasoning behind non-obvious choices — this file records *what* changed, that file records *why*.

Entry format:
```
## YYYY-MM-DD — short title
Branch: <branch name>
Files: <files touched>
What changed: <plain description>
Related decisions: <link to DECISIONS.md entry, if any>
```

---

## 2026-09-12 — Notification bell dropdown (`NotificationCenter.js`) redesigned to brand teal + square
Branch: main
Files:
- `app/automation/components/NotificationCenter.js` (the sidebar bell icon + its dropdown panel — untouched by any prior reskin session per CLAUDE.md/DECISIONS.md search, still on the old palette until now): bell button and dropdown panel `rounded-xl`/`rounded-2xl`/`rounded-b-2xl` → `rounded-none`; bell hover `hover:bg-slate-100` → `hover:bg-[#F0F9F5] hover:text-[#1D4B3E]`; row hover `hover:bg-slate-50` → `hover:bg-[#F0F9F5]`; unread-row tint `bg-indigo-50/30` → `bg-[#F0F9F5]/60`; "Mark all as read", "View Details →", the unread mark-as-read dot, and the footer "View All Activity" hover — all recolored from indigo to `#1D4B3E`; per-notification-type icon colors recolored — `email_message` indigo→Gmail-blue `#4285F4` (channel-identity, same reasoning as the chat inbox), `conversation_assigned`/`new_lead` → brand teal `#1D4B3E`, `internal_mention`/`task_reminder`/`automation_alert` (previously amber/amber/purple) → `teal-600`; `whatsapp_message` (emerald) and `instagram_message` (pink) left as-is since those are real channel-brand colors, not decorative accents. Unread-count badge stayed red (semantic alert, not decorative).

What changed: user asked to redesign the notification dropdown specifically — "make it square", a green hover, and "fully professional...like interakt". This component had never been touched by any of the earlier reskin passes (sidebar, chat inbox, dashboard) despite living in the same sidebar header, so it was the last remaining piece of the app still on the pre-reskin indigo/amber/purple mix with `rounded-xl`/`2xl` corners. Verified live in Chrome: dropdown opens, shows real notifications (a "Conversation assigned to you" + 3 WhatsApp message rows) with square panel/icon-chips, teal "Mark all as read"/"View Details" links, no console errors.
Related decisions: none — same established `#1D4B3E`/`rounded-none` conventions applied, no new pattern.

## 2026-09-12 — Dashboard follow-up: fully square corners, grey canvas, resizable revenue chart
Branch: main
Files:
- `app/automation/page.js`, `app/automation/components/dashboard/DashboardSkeleton.jsx` (page + loading-skeleton background `bg-white`→`bg-[#F8F9FA]`, so the grey canvas shows through the gaps between cards instead of cards blending into a white page)
- `app/automation/components/dashboard/premium/PremiumDashboardHeader.jsx` (sticky header bg matched to the same grey; every button — bell, search, Share, Ask AI, Customize Widget, Imports/Exports split-buttons — flattened from the 4px `rounded` convention to fully square `rounded-none`)
- `app/automation/components/dashboard/premium/tokens.js` (`UI.btnPrimary/btnDark/btnGhost/iconBtn` recipes → `rounded-none`)
- `RevenueChartCard.jsx`, `LeadsManagementCard.jsx` (timeframe/tab toggle pills + CTA buttons → `rounded-none`); `NeedsAttentionCard.jsx`, `WidgetMenu.jsx` (tab buttons, kebab-menu trigger + popover panel → `rounded-none`)
- `PremiumCard.jsx` (the shared card shell every dashboard widget renders through) plus `HeroKpiRow.jsx`, `LeadsManagementCard.jsx`'s stat boxes, `PipelineBreakdownCard.jsx`'s stage boxes + bars, `RetentionChartCard.jsx`'s bar tops, `WidgetCard.jsx`'s icon badge, `CalendarScheduleCard.jsx`'s meeting/slot cards, and the page-level error banner — all had their soft `rounded-[9–14px]` corners flattened to `rounded-none` too, once the user confirmed the square direction should extend from buttons to every card/tile, not just buttons
- `RevenueChartCard.jsx` (the revenue chart card gained `resize-y overflow-auto` with `min-h-[240px] max-h-[80vh]` in place of a fixed `h-[40vh] max-h-[40vh]` — a native browser drag-handle now lets the user grow or shrink it)
- `NeedsAttentionCard.jsx` (unrelated bugfix found via console while doing this pass — row objects carried a `key` field that got spread into `<Row {...r}/>` via JSX, which React 19 flags as invalid since `key` isn't a real prop; renamed the field to `id` and pass `key={r.id}` explicitly)

What changed: first follow-up round said "make square button" and asked for a grey page background behind white cards (dashboard cards were floating on an all-white page with no separation). Implemented buttons-only initially, but the user's next message pointed at the KPI tiles specifically ("this card also proper square which our going on") — treated as extending the square language from buttons to every card/tile on the page, so did a second pass flattening every remaining soft-radius card container. Also asked for the revenue chart to be resizable ("increase the size or reduce it") — used the browser-native `resize` CSS property rather than building a custom drag-handle component, since it's the standard low-effort way to make a block resizable and needs no new JS.
Related decisions: see DECISIONS.md 2026-09-12 dashboard-premium-teal-recolor entry (extended).

## 2026-09-12 — Dashboard (`/automation`) recolored to brand teal + 2 new cards from unused API data
Branch: main
Files:
- `app/automation/components/dashboard/premium/tokens.js` (`DASHBOARD_THEME`/`CHART`/`UI` — the dashboard's own design-tokens file from an earlier "premium redesign" pass — retinted from emerald `#059669`-family to the app-wide brand teal `#1D4B3E`/mint `#F0F9F5`/`#BAE0CF`; button recipes flattened from `rounded-[10px]` to `rounded` (4px))
- `PremiumDashboardHeader.jsx`, `HeroKpiRow.jsx`, `RevenueChartCard.jsx`, `LeadsManagementCard.jsx`, `WidgetCard.jsx`, `WidgetMenu.jsx`, `CalendarScheduleCard.jsx` (same recolor + button-flattening sweep applied to every hardcoded emerald literal these files carried independently of `tokens.js` — chart line/gradient/hover-dot, tab pills, header buttons, widget icon badges, kebab menus. Left untouched on purpose: `TrendBadge.jsx`'s green/red positive-negative indicator, the same spot in `RevenueChartCard`/`HeroKpiRow`/`RetentionChartCard`'s own "+X% vs last period" text, and `CalendarScheduleCard`'s multi-hue avatar palette — all semantic/identity carve-outs, same category already established for chat/tasks this session)
- `RetentionChartCard.jsx` (segment colors now pull a 3-stop teal ramp `#1D4B3E`/`#2F6B58`/`#8FC4AE` from `tokens.js` — no direct edits needed since it already imported `CHART`)
- New `app/automation/components/dashboard/premium/NeedsAttentionCard.jsx` — replaces `TopLocationsCard` in the bottom row. 5-tab card (Hot Leads / Stale Deals / Follow-ups / Payments / Overdue Tasks) built entirely from the `focus` object the dashboard API (`/api/automation/dashboard`) already computed and returned but that nothing on the dashboard rendered
- New `app/automation/components/dashboard/premium/PipelineBreakdownCard.jsx` — new full-width row beneath the existing 3-card row, rendering the `pipeline` stage-breakdown array (also already computed, also previously unrendered) as a per-stage count/value/bar grid, using each stage's own configured `color` rather than a fixed brand color
- `app/automation/page.js` (swapped `TopLocationsCard`→`NeedsAttentionCard`, added `PipelineBreakdownCard` as a new row; `data-tour="dashboard-kpis"`/`"dashboard-revenue"`/`"dashboard-ask-ai"` hooks for the existing spotlight tour left untouched)

What changed: user asked for a "fully premium, Interakt/Robinhood-style" dashboard redesign and explicitly asked for external research before designing. Researched CRM-dashboard best practices and Robinhood/premium-SaaS design trends (sources in DECISIONS.md), then found — via a full research pass on the current dashboard — that it had already been through a "premium" redesign in an earlier, undocumented session that never got folded into this session's teal/mint system (it standardized on emerald `#059669` instead), and that the dashboard's own API already computes a `focus` dataset (hot leads, stale deals, follow-ups, payments pending, overdue tasks) and a `pipeline` stage breakdown that nothing on the page renders. Asked the user 2 scoping questions before touching anything: whether to replace the low-value "Top Locations" world-map card with a new card built from the unused `focus` data (yes), and whether to add a new Pipeline breakdown card from the unused `pipeline` data (yes). Verified live in Chrome: no console errors, Needs Attention's tabs switch correctly and show real per-tab data (confirmed via a real stale deal), Pipeline Breakdown renders all 8 real pipeline stages with correct counts/values, and the dashboard tour's 3 `data-tour` hooks are untouched.
Related decisions: see DECISIONS.md 2026-09-12 dashboard-premium-teal-recolor entry.

## 2026-09-12 — Bill PDF template redesigned to look professional
Branch: main
Files:
- `lib/bills/pdfRenderer.js` (full visual rework of `renderBillPdf` — same function signature/inputs/output, purely a layout/styling change: added a full-page rounded border frame; business name bumped to 24pt bold; the old plain "BILL" + "BILLED TO" text blocks are now two light `#F8FAFC` card panels with hairline borders; added a status badge (draft/sent/viewed/paid/void, each its own color) next to the bill number, surfacing `Bill.status` visually for the first time; line-item table header is now a solid dark-charcoal fill with white text instead of light-gray-on-gray, plus zebra-striped rows and an outer border around the whole table block; the grand TOTAL is now rendered as a dark filled pill so it reads as the one number that matters at a glance, instead of just being slightly bolded text like the other total rows; footer gained a divider rule above "Thank you for your business." and a small "Generated on <date>" timestamp line)

What changed: user said the bill/invoice PDF customers receive "is not professional" and asked to make it professional. The previous template was functionally complete (logo, business identity, line items, totals, notes, GSTIN) but visually flat — thin gray-on-gray everywhere, no visual hierarchy, no emphasis on the total, no indication of the bill's status. Rebuilt the same layout with real typographic hierarchy and contrast (dark header row, card-panel metadata blocks, a bold total pill, a full-page frame) while deliberately keeping the palette neutral charcoal/slate rather than introducing this app's own brand teal — the file's existing top-of-file comment is explicit that this is the *business's* customer-facing document and must carry zero LeadForGrow branding, and baking in our own product's brand hue would quietly violate that even though it's not literally a logo. Verified by rendering a sample bill locally (multi-line-item wrapping, discount+tax+total math, long description word-wrap) to a PDF and visually inspecting it before considering the change done — did not just trust that jsPDF calls compiled.
Related decisions: see DECISIONS.md 2026-09-12 bill-pdf-neutral-professional entry.

## 2026-09-12 — WhatsApp Templates page rebuilt as a Template Library board (Interakt-style)
Branch: main
Files:
- `models/automation/WhatsAppTemplate.js` (added `isDeleted`/`deletedAt` for soft-delete; briefly added then removed a `marketingCategory` field — see below)
- `app/api/automation/whatsapp-templates/route.js` (GET excludes soft-deleted by default, add `?deleted=true` to list only deleted ones)
- `app/api/automation/whatsapp-templates/[id]/route.js` (DELETE is now a soft-delete — sets `isDeleted`/`deletedAt` instead of `deleteOne()` — still hard-deletes the Meta-side template first if one exists; PUT gained a `{ restore: true }` path to un-delete)
- `app/automation/whatsapp-templates/templateCategories.js` (new — `TEMPLATE_CATEGORIES` display-label map for Meta's real `category` enum: MARKETING→"Promotional", UTILITY→"Utility", AUTHENTICATION→"Authentication")
- `app/automation/whatsapp-templates/page.js` (full rebuild — header with icon+title+"Managing WhatsApp Templates" subtitle and a "+ New Template" button; 3 underline tabs "Template Library"/"Active"/"Deleted"; Template Library tab shows horizontally-scrolling category columns of `TemplateCard`s — pale-green preview card with a hover overlay showing "Use this template" + an "Expand" button that opens the existing `TemplateBuilder`; Active tab keeps the original status-pill-filter + search behavior but its cards were restyled to the same pale-green `TemplateCardBody` block (status badge overlaid top-right) instead of the old plain-white info card; new Deleted tab lists soft-deleted templates as the same green-bodied cards with a "Deleted Xd ago" + Restore footer — all 3 tabs now read as one consistent card language instead of 3 different styles)

What changed: user shared a screenshot of Interakt's own Templates Library page (category columns with template count, pale-green preview cards, hover "Use this template"/"Expand", Template Library/Active/Deleted tabs) and asked to rebuild `/automation/whatsapp-templates` to match. First pass grouped templates by a new invented 6-value taxonomy (Promotional/Transactional/Service Alerts/Lead Qualification/Informative/Occasional, stored in a new `marketingCategory` schema field) since that's what the reference screenshot showed — but the real data in this app only ever populates Meta's actual 3-value `category` enum (MARKETING/UTILITY/AUTHENTICATION), so every existing template defaulted into one bucket and the other 5 columns were permanently empty. User pushed back ("remove this... just promotional and utility... make it organised"), so the invented taxonomy was fully removed (schema field, API branches, builder UI, the categories file) and replaced with grouping by the real `category` field instead, with empty columns hidden entirely rather than shown as clutter.
Related decisions: see DECISIONS.md 2026-09-12 template-library-real-categories entry.

## 2026-09-12 — Unified Inbox follow-up: real channel colors, richer bubble green, polished dropdown menus
Branch: main
Files:
- `app/automation/components/chat/ChatSidebar.jsx` (channel filter pills no longer force every active channel into brand teal — added `CHANNEL_ACTIVE_BG` map so WhatsApp/Instagram/Email keep their own real brand color when selected; search-results dropdown restyled to the same inset-rounded-row hover pattern as the other inbox menus)
- `app/automation/components/chat/constants.js` (`CHANNEL_META.email` reverted from the brand-teal it got in the prior full-green pass back to Gmail blue `#4285F4`)
- `app/automation/components/chat/ConversationItem.jsx` (email channel icon color reverted to `#4285F4` to match)
- `app/automation/components/chat/MessageList.jsx` (thread wallpaper: dropped WhatsApp's dotted-texture beige background in favor of a flat, lighter `#F1F6F3`)
- `app/automation/components/chat/MessageBubble.jsx` (outgoing bubble changed from a pale washed-out mint tint to a solid, richer `#1F8A5E` with white text — user twice flagged the bubble background as "not good"; incoming bubble gained a subtle border so it stays visually distinct against the now-lighter thread background)
- `app/automation/components/chat/InboxActionsMenu.jsx`, `ChatInput.jsx` (templates dropdown, signature picker, emoji popover), `ChatSidebar.jsx` (search results) — every inbox dropdown menu now shares one pattern: `rounded` (4px) container, `p-1.5` inset padding, and individual rows as `rounded` hover targets in the brand mint tint, instead of full-bleed hover strips with divider lines

What changed: after the initial full green-theme inbox redesign, user sent two more screenshots. First: the channel filter pills' active state had been flattened to one brand-teal color regardless of channel, which read wrong for Instagram (should read pink-ish/on-brand for IG) and Email (should read blue like Gmail) — channel identity colors are a different category from the messy state-color problem the original redesign was fixing, so they were restored per-channel. Second: the kebab "⋮" actions menu looked inconsistent — asked for "square box with hover and proper left alignment... professional buttons" — fixed by standardizing every dropdown menu in the inbox on one square-cornered, inset-hover-row pattern. Separately, user twice said the outgoing chat bubble background wasn't good; the literal WhatsApp pale-mint tint was replaced with a solid richer brand green.
Related decisions: see DECISIONS.md 2026-09-12 inbox-channel-colors-followup entry.

## 2026-09-12 — Unified Inbox: full green-theme + WhatsApp-font redesign, rectangle buttons
Branch: main
Files:
- `app/globals.css` (new `--font-whatsapp: -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;` var, additive alongside the existing `--font-*` vars)
- `app/automation/chat/page.js` (root container gets `font-[family-name:var(--font-whatsapp)]` — cascades to all 3 panes since no child sets its own font; Suspense spinner recolored to brand teal `#1D4B3E`)
- `app/automation/components/chat/ChatSidebar.jsx` (channel filter pills + status tabs unified from mixed `emerald-600`/`teal-600` `rounded-md` pills onto one `bg-[#1D4B3E] rounded` (4px) language; search input focus ring + radius updated to match)
- `app/automation/components/chat/ConversationItem.jsx` (active-row indicator `border-l-teal-600`/`bg-teal-50` → `border-l-[#1D4B3E]`/`bg-[#F0F9F5]`; "Live" intervened badge violet→teal; favorite star amber→green; email-channel icon color violet→teal)
- `app/automation/components/chat/constants.js` (`ORIGIN_META` automation/sequence/broadcast pills moved off violet/sky/amber onto teal/lime/green; `CHANNEL_META.email` indigo→teal)
- `app/automation/components/chat/ChatHeader.jsx` (Intervene button violet→teal, `rounded-lg`→`rounded`)
- `app/automation/components/chat/MessageBubble.jsx` (internal-note bubble amber→green; star hover-action amber→green; literal WhatsApp bubble colors, read-tick blue, and the red "Not delivered" failed-banner left untouched on purpose — see DECISIONS.md)
- `app/automation/components/chat/ChatInput.jsx` (Reply/Note mode toggle, "Note only" banner, note-mode composer chrome, and send button all moved amber→green; "Take over chat to reply" gate violet→teal; signature-picker accent indigo→teal; every button/input in the composer flattened `rounded-xl`/`rounded-md`→`rounded`)
- `app/automation/components/chat/EmailFolderBar.jsx` (active folder pill indigo→brand teal, flattened to `rounded`)
- `app/automation/components/chat/InboxActionsMenu.jsx` (active-favorite menu row amber→green)
- `app/automation/components/chat/MediaAttachmentStrip.jsx` (upload progress bar teal-500→brand `#1D4B3E`)
- `app/automation/components/chat/OutOfWindowTemplateBar.jsx` (entire amber-themed banner — background, borders, text, template cards, category badges, send button — converted to green; every rounded-lg control flattened to `rounded`)
- `app/automation/components/chat/CRMProfilePanel.jsx` (the file the redesign request centered on — shared `Section` collapsible now tints its open panel `bg-[#F0F9F5]/40` and its chevron `#1D4B3E` on open, mirroring the sidebar reskin's group-panel treatment; follow-up quick-pick buttons + "Create bill" button + Notes "Add" button all flattened to `rounded` and recolored onto brand teal/green; Pipeline/Assigned-agent selects get a teal focus ring; stray indigo CRM-label fallback color → teal)
- `app/automation/components/chat/MessageList.jsx` (loading-spinner color emerald→brand teal, for consistency)

What changed: user shared a screenshot of the Unified Inbox (conversation list / chat thread / Customer profile panel) and asked for a full redesign — a real WhatsApp-accurate font, one consistent green theme instead of the mixed teal/emerald/violet/amber/indigo the feature had accumulated across ~15 files with no shared design language, properly rectangular buttons instead of pill shapes, and a cleaner chevron-driven collapse treatment in the Customer profile panel to match the Interakt look already established elsewhere in this app (sidebar + pricing reskins). Asked the user two scoping questions before touching code: (1) whether "green theme" should fully replace the violet/amber accent colors too, or keep them as distinct semantic signals — answered "all green, no exceptions"; (2) whether the WhatsApp font stack should apply only to the chat bubbles/composer or across all three panes — answered "everywhere in the inbox". Implemented both literally, with three narrow, disclosed carve-outs kept in place (destructive red for delete/spam/failed-message states; the amber-tiered SLA "waiting for reply" badge's grey→amber→red urgency escalation in `ConversationItem.jsx`; and the per-contact avatar initial-color palette, which intentionally spans several hues so contacts stay visually distinguishable in the list) — all three are safety/usability-critical signals rather than decorative accents, and are called out explicitly rather than silently left inconsistent. Visual verification blocked on this session not holding login credentials for the CRM; user opted to log in and check it themselves rather than share credentials.
Related decisions: see DECISIONS.md 2026-09-12 inbox-green-redesign entry.

## 2026-09-11 — Public site footer rebuilt as dark Interakt-style footer
Branch: main
Files:
- `app/components/marketing/EnterpriseFooter.jsx` (structural rewrite — dropped the light-gradient card layout, top CTA row, and social row rendered as text links; new footer is a flat `bg-[#1D4B3E]` (same brand teal used in the automation sidebar reskin) band with logo+tagline on the left, all 5 `FOOTER_SECTIONS` as columns on the right, and a bottom bar with copyright + `FOOTER_LEGAL` links + circular white social-icon buttons; logo mark (`/image.png`, a solid indigo glyph) forced to pure white via `brightness-0 invert` and the wordmark text made a plain solid white — no more colored accent on "For" — per explicit ask so both the mark and the wordmark read as one monochrome white lockup on the dark band, matching the reference Interakt screenshot's logo treatment; added a hand-drawn `XIcon` (Simple Icons path) since lucide only ships the legacy Twitter bird)
- `lib/marketing/footerLinks.js` (`FOOTER_SOCIAL` entries gained an `id` key so `EnterpriseFooter` can map each to a real brand icon + color; added a WhatsApp entry reusing the same `wa.me/916366966120` support number already used on the pricing and help-center pages; did NOT add an Instagram entry — no verified handle exists anywhere else in the repo, and inventing one would have shipped a dead/wrong link)

What changed: user shared a screenshot of Interakt's own dark-green footer and asked for "same to same footer ui" minus two things visible in that screenshot — the G2 "Best Est. ROI / High Performer / Fastest Implementation" award badges, and the "a product by Jio | Haptik" logo lockup — plus "and all working". Rebuilt to match Interakt's structure (dark flat band, logo+tagline block, bold-header nav columns, bottom copyright/legal/social row) while keeping our own 5 nav categories (Product/Solutions/Resources/Company/Trust, all pre-existing links, none dropped) rather than trimming to Interakt's 3 columns. Deliberately did NOT add App Store / Google Play badges from the reference screenshot even though not explicitly excluded — there is no LeadForGrow mobile app, so those buttons would be dead links, which would violate the "all working" ask. Verified "all working" by curling all 40 internal footer routes (all 200, three expected 307 redirects to canonical pages) and confirming the `footer` DOM renders the dark bg / white logo correctly live in Chrome.
Related decisions: see DECISIONS.md 2026-09-11 footer-interakt-style entry.

## 2026-09-11 — Pricing: fix ribbon clipping, repriced Growth/Scale, add-ons section, more integration logos
Branch: saurabh
Files:
- `app/components/pricing/PricingTable.jsx` (outer scroll wrapper `pt-4` → `pt-10`, and the popular-column overlay `top`/`height` offset `-14px` → `-17px`, fixing the "MOST POPULAR" ribbon being clipped at the top of the viewport — the wrapper's padding was too small to contain the ribbon's full negative offset)
- `app/components/pricing/pricingData.js` (Growth: `monthlyPrice` 3499→2999, `quarterlyPrice` 3199→2699, `yearlyPrice` 2699→2499; Scale: `monthlyPrice` 6999→5999, `quarterlyPrice` 6499→5499, `yearlyPrice` 5399→4999; `AI Knowledge Base` row's `growth` value `false` → `'Limited'` so Growth shows a text badge instead of a blank dash; new `PRICING_ADDONS` export — `Extra 1,000 leads` ₹499/mo, `Extra team member` ₹99/mo; `INTEGRATIONS` array grew from 11 to 17 entries and `INTEGRATIONS_COUNT` bumped '15+' → '17+')
- `app/components/pricing/IntegrationBrandIcons.jsx` (added 6 more real brand-icon components: `ShopifyIcon`, `HubSpotIcon`, `SalesforceIcon`, `CalendlyIcon`, `SlackIcon`, `ZohoIcon` — same Simple Icons pattern as the existing set, fetched live via WebFetch from the simple-icons CDN)
- `app/components/pricing/IntegrationsTeaser.jsx` (wired the 6 new icons into the `ICONS` map)
- `app/components/pricing/PricingAddOns.jsx` (new — "Need a little more? Add it, don't upgrade" section, two simple cards for the leads/seat add-ons, rendered between `PricingTable` and `IntegrationsTeaser`)
- `app/pricing/page.js` (added `<PricingAddOns />`)

What changed: four separate follow-up requests bundled into one pass. (1) User reported the "MOST POPULAR" badge on the Growth column was getting cut off at the top of the table — root cause was the scroll wrapper's `pt-4` (16px) padding being smaller than the ribbon's actual negative offset (roughly 27px, since the ribbon sits 13px above an overlay that itself starts 14px above the grid); fixed by increasing both the wrapper padding and, per the user's explicit ask, the overlay's poke-above distance by 3px. (2) Growth repriced to ₹2,999/mo · ₹2,699/qtr · ₹2,499/mo yearly; Scale repriced to ₹5,999/mo · ₹5,499/qtr · ₹4,999/mo yearly — Starter and Enterprise untouched. (3) Added a pay-as-you-grow add-ons section so a team near a limit doesn't have to jump a whole tier. (4) Growth's AI Knowledge Base row now reads "Limited" instead of a blank dash, since the plan does get limited access. (5) Expanded the integrations logo row from 11 to 17 real brand icons per a mid-session follow-up ("add more integration logo") — added Shopify, HubSpot, Salesforce, Calendly, Slack, Zoho, matching the breadth of Interakt's own integrations row (Salesforce, Freshworks, HubSpot, Shopify, Zoho, etc.). Verified every change live in Chrome: ribbon no longer clipped, all three billing-toggle states show correct prices, "Limited" renders correctly, add-ons cards render, and all 17 logos display without console errors.
Related decisions: see DECISIONS.md 2026-09-11 pricing-fidelity entry (extended).

## 2026-09-11 — Pricing table rebuilt as one continuous CSS Grid (was table + floating cards)
Branch: saurabh
Files:
- `app/components/pricing/PricingTable.jsx` (structural rewrite — replaced the `<table>`/`<th>`/`<td>` markup with a single CSS Grid: `grid-template-columns: 220px repeat(4, 1fr)`, 5 grid children per "row" rendered in DOM order so header/price/CTA/channels/every feature row all share the exact same column tracks; every cell gets a 1px `#E5E7EB` `border-top`/`border-left` so the whole thing reads as one hairline-bordered table instead of 4 separate rounded/shadowed cards sitting above a second table; CTA buttons `rounded-lg` (8px) → `rounded` (4px); dropped the per-column `boxShadow` ring + `rounded-t-2xl`/`rounded-b-2xl` "popular card" treatment entirely)

What changed: user compared our pricing page against a screenshot of Interakt's and flagged that ours read as 4 independent floating pricing cards sitting on top of a separate comparison table below, instead of one continuous table where the plan header/price/CTA/channels visually belong to the same column as the feature rows underneath. Also asked for the "Most Popular" (Growth) column's highlight to be a border that wraps the *entire* column top-to-bottom and pokes up above the header — not just a ring around the small header card — plus sharp/near-rectangular buttons (was too pill-like), perfect top alignment across all 4 plan columns, and consistent 1px grid lines throughout.

Rebuilt on CSS Grid instead of patching the `<table>`: every "row" (header, channels, category header, each feature row) is 5 grid items in a row (label + 4 plan cells, or one `grid-column: 1/-1` spanning cell for category headers) — this makes every plan's header cell automatically the same height as its siblings (grid rows auto-size to the tallest cell in that row) with zero extra spacer hacks, and makes clean continuous column dividers trivial (each cell just gets its own `border-left`, which stacks visually into one line since cells butt together with no grid gap). Confirmed live via Chrome DevTools that Interakt's real table uses exactly this shape: 0px border-radius on all inner cells, a ~0.83px hairline border color `#EBEFF2` between rows/columns, and equal-width columns (label column same width as each plan column, 250px of 1250px total) — matched with `rounded` (4px) buttons and `#E5E7EB` grid lines as our own equivalent.

The recommended-plan highlight is rendered as one absolutely-positioned overlay div (not a per-cell border) sized via `calc()` against the known column track widths — `top: -14px`, `height: calc(100% + 14px)` — so it visually pokes above the table's top edge and wraps the full column height in a single unbroken border, with the "Most Popular" pill riding on top of the poke. The overlay sits in a `position: relative` wrapper that is a *sibling* of the `overflow-hidden` rounded grid container (not a child of it), so the poke-above effect isn't clipped by the grid's own rounded-corner clipping.
Related decisions: see DECISIONS.md 2026-09-11 pricing-grid-rebuild entry.

## 2026-09-11 — Pricing page: real integration logos + "Find the right plan" header row
Branch: saurabh
Files:
- `app/components/pricing/IntegrationBrandIcons.jsx` (new — real brand-mark SVG icon components for Meta, Google Calendar, Razorpay, Stripe, Twilio, Zapier, Google Sheets; Simple Icons paths, same pattern/source as the existing WhatsApp/Instagram/Gmail icons in `BrandIcons.jsx`)
- `app/components/pricing/pricingData.js` (`INTEGRATIONS` array: every entry now points at a real icon component instead of `kind: 'word'` plain text; `Webhooks` uses lucide's generic `Webhook` glyph since it isn't a company)
- `app/components/pricing/IntegrationsTeaser.jsx` (extended the icon map with the 7 new brand icons + `Webhook`; collapsed the old icon-vs-wordmark two-branch render into a single icon+label chip for every integration, since all of them have real icons now)
- `app/components/pricing/PricingTable.jsx` (thead: the previously-empty first `<th>` now holds Interakt's own row label copy, "Find the right plan for your needs", top-aligned with the plan columns; each plan's seats line gets a small `Info` icon with a real tooltip, matching the position of Interakt's `(i)` icon next to "Unlimited agents (All Roles)")

What changed: user sent a follow-up screenshot flagging two more gaps against interakt.shop/pricing: (1) our plan-header row was missing the left-side row label they show ("Find the right plan for your needs") and the small info icon next to each plan's seat/agent line; (2) our bottom integrations band showed most integrations as plain colored text instead of real company logos like Interakt's own row (Salesforce, HubSpot, Shopify, Zoho, etc. logos). Fixed both: fetched real, accurate SVG path data live via WebFetch from the `simple-icons` npm package's public CDN for every missing brand (Meta, Google Calendar, Razorpay, Stripe, Twilio, Zapier, Google Sheets — verified each fetch against known brand shapes rather than trusting memory), and added the exact row label + info-icon affordance to the pricing table header, matching Interakt's structure/position while keeping our own numbers (seats stays "3 team members" etc., not their "Unlimited agents (Owner Roles)" copy — position/format copied, content stays ours). Verified live in Chrome: no console errors, row label renders correctly aligned above each plan's CTA column, every integration chip shows a real recognizable logo.
Related decisions: see DECISIONS.md 2026-09-11 pricing-fidelity entry (extended).

## 2026-09-11 — Pricing page rebuilt as an Interakt-style grouped feature-matrix
Branch: saurabh
Files:
- `app/components/pricing/pricingData.js` (rewritten — `PRICING_PLANS` now 4 tiers: Starter ₹1,299/mo·₹999/mo yearly (exact numbers given), Growth ₹3,499/₹2,699, Scale ₹6,999/₹5,399, Enterprise custom — yearly price on every tier is a consistent ~23% off monthly, matching the ratio implied by the given Starter numbers rather than a different % per tier; `FEATURE_CATEGORIES` replaces the old flat `features[]` bullet list with an Interakt-shaped grouped matrix (Channels / CRM & Sales / Automation / AI / Insights & Support / Monthly limits), each row resolving true/false/string per plan; numbers for seats/forms/automation-rules/leads-per-month are pulled from the REAL enforced quotas in `lib/plans.js` via an explicit tier-name → backend-`plan`-enum mapping documented in a comment, not invented; dropped now-superseded `ADDONS`/`COMPARISON_ROWS`/`USAGE_LIMITS`/`ONBOARDING_STEPS`/`TRUST_BADGES` exports)
- `app/components/pricing/PricingTable.jsx` (new — the core piece: Monthly/Yearly pill toggle with a savings badge, 4-column plan header row with per-tier accent colors + CTA buttons, a Channels chip row, then the collapsible category-header-bar + checkmark-matrix pattern, all modeled closely on `app.interakt.shop/pricing`'s own layout — colors/spacing/typography scraped live via Chrome DevTools Protocol, same technique used for the sidebar reskin earlier this session)
- `app/components/pricing/PricingHero.jsx` (rewritten — old split hero-with-animated-dashboard-mockup replaced with a simple centered eyebrow+headline+subhead block matching Interakt's own pricing-page hero shape; billing toggle itself lives in `PricingTable.jsx`, not here, since it directly controls the table)
- `app/pricing/page.js` (dropped `'use client'` — now a real Server Component so it can export `metadata`; section list trimmed from 10 sections to 4: Hero, PricingTable, PricingFAQ, PricingFinalCTA, matching Interakt's own leaner pricing-page structure)
- Deleted (superseded by `PricingTable.jsx`, or confirmed orphaned — see DECISIONS.md): `PricingPlans.jsx`, `ComparisonMatrix.jsx`, `AddonsSection.jsx`, `RoiCalculator.jsx`, `UsageLimitsSection.jsx`, `OnboardingTimeline.jsx`, `EnterpriseSection.jsx`, `app/components/landing/LandingPricingSection.jsx` (unused, no importers anywhere)
- `app/components/landing/landingStyles.js` (removed a dead `@deprecated` re-export of `PRICING_PLANS`/`TRUST_BADGES` that only `LandingPricingSection.jsx` consumed)
- `PricingFAQ.jsx`, `PricingFinalCTA.jsx` — untouched (already generic enough; FAQ content itself updated via the `PRICING_FAQ` array in `pricingData.js`, same `{q, a}` shape as before)

What changed: per explicit request, rebuilt the pricing page to closely copy Interakt's pricing-page UI pattern (grouped comparison table, billing toggle, per-tier accent colors, rectangular buttons) while keeping our own numbers, features, and — per an explicit exception — our own plan accent colors (slate/emerald/indigo/near-black) rather than Interakt's literal amber/teal/blue/dark-teal. Every plan now visibly includes Email (Gmail/SMTP) with a highlighted note ("Included on every plan — even your free trial"), Instagram unlocks from Growth up, matching the channel-tiering the user described. Verified live in Chrome: full page renders with no console errors, the Monthly/Yearly toggle correctly swaps ₹1,299 ↔ ₹999 (and the other tiers), category sections collapse/expand, and the final CTA/footer render correctly below the table.
Related decisions: see DECISIONS.md 2026-09-11 pricing-page-rebuild entry.

## 2026-09-11 — Pricing page: high-fidelity Interakt color/icon copy pass
Branch: saurabh
Files:
- `app/components/pricing/pricingData.js` (accent keys renamed slate/emerald/indigo/ink → amber/teal/blue/forest to hold the real Interakt tier colors; added `quarterlyPrice` per plan + `QUARTERLY_DISCOUNT_LABEL`; added `INTEGRATIONS`/`INTEGRATIONS_COUNT` data for the new teaser section)
- `app/components/pricing/PricingTable.jsx` (full rebuild — exact per-tier hex colors scraped live from interakt.shop/pricing via Chrome DevTools computed styles; filled circle-checkmark badges via a new `CheckBadge` component instead of plain check icons; full per-column tinted backgrounds through every feature row, not just the popular column; added a 3rd Quarterly billing-toggle segment)
- `app/components/pricing/IntegrationsTeaser.jsx` (new — bottom-of-page "Unifying Your Workflow with 15+ Plug & Play Integrations" band, close copy of Interakt's own integrations teaser: light-grey band, bold heading, teal pill CTA, row of icon/wordmark chips)
- `app/pricing/page.js` (wired `IntegrationsTeaser` in between `PricingTable` and `PricingFAQ`)

What changed: user rejected the first pricing pass (previous entry above) as not matching Interakt's actual UI closely enough — explicit follow-up: "100% same to same ui eveyrhting try to be exact... just text different". Re-scraped interakt.shop/pricing's live computed styles (not just screenshots this time) to pull their real per-tier colors and checklist styling:
- Starter → button `#FAB534` amber / black text, checklist column tint `#FFF1D6`, checkmark badge `#FAB534`
- Growth → button `#05A68B` teal / white text, tint `#EFF1F5` (a neutral grey, not colored — copied as-is even though it doesn't match the button color, because that's genuinely what Interakt does)
- Scale → button `#0096DE` blue / white text, tint `#DFF5FF`, but checkmark badge `#12295F` navy (also copied as-is — their checkmark color doesn't match their own button color for this tier either)
- Enterprise → button `#004C3D` dark green/forest / white text, tint `#E3FFFA` mint, checkmark badge `#038CFF` bright blue

Their checkmark icon is Font Awesome's solid `fa-check-circle` glyph (a filled colored disc with a white check cut out) — replicated with a small custom `CheckBadge` component (colored circle + white Lucide `Check`) since Lucide has no equivalent solid glyph.

Also replicated their bottom "Unifying Your Processes with 60+ Plug & Play integrations" band as `IntegrationsTeaser.jsx`, using our own real integrations. WhatsApp/Instagram/Gmail get real brand icons (already in `BrandIcons.jsx`); the rest (Meta Lead Ads, Google Calendar, Razorpay, Stripe, Twilio, Zapier, Webhooks, Google Sheets) render as colored wordmark chips — matching Interakt's own row, which itself mixes icon glyphs with pure text logotypes (their "Tally Prime", "HubSpot", "Zoho", "PayU" are wordmarks, not icon+label pairs).

Per the user's explicit final instruction ("just text different"), this pass treats the earlier "don't copy their plan background colors" caveat as superseded — only our copy, feature data, and the exact Starter pricing (₹1,299/mo, ₹999/mo yearly, unchanged) remain ours; the visual system is now a direct color-for-color copy. Verified live in Chrome: no console errors, correct per-column tint/checkmark colors at every scroll position, correct CTA button colors, integrations band renders as expected.
Related decisions: see DECISIONS.md 2026-09-11 pricing-fidelity entry.

## 2026-09-11 — Leads table restyled to match Interakt Contacts + dev server hang fixed
Branch: saurabh
Files:
- `app/automation/components/leads/constants.js` (`TABLE_ROW_LINE` border color changed from invisible white to `#E5E5E7`, matching Interakt's Contacts table row divider exactly; added an 11th `white` entry to `LEAD_ROW_COLORS` — `#ffffff` swatch, first in the grid)
- `app/automation/components/leads/LeadTable.jsx` (header row: `text-[11px] uppercase tracking` → `text-[14px] font-semibold`, no uppercase — matches Interakt's plain-case bold header; container radius `rounded-[12px]` → `rounded-[4px]`; table/thead bg → `#F8F9FA` light grey)
- `app/automation/components/leads/LeadRow.jsx` (every data cell unified to `text-[14px] font-normal text-[#222222]` — previously a mix of 11-13px with varying weights/grays; action-icon buttons `rounded-md` → `rounded` to match the 4px-radius rectangle language)
- `app/automation/components/leads/LeadsHeader.jsx` (search box widened — `min-w-[200px]` → `lg:min-w-[380px]`, group `max-w-3xl` → `max-w-4xl`; header bg `#f8f9fc` tint → pure white; every toolbar button/input `rounded-lg` → `rounded`, border color → `#D0D4E1` matching Interakt's filter-button border exactly)
- `app/automation/components/leads/CRMFilterBar.jsx` (same `rounded-lg` → `rounded` + border-color sweep across the smart-view pills, status/source/agent selects, date-range button, save-view input)
- `app/automation/leads/page.js` (page canvas + the filter-bar section wrapper → `#F8F9FA` light grey, so the table and filter *sections* read as tinted panels while every button/input inside them stays pure white — explicit follow-up correction after an initial pure-white pass)
Colors/sizes for this pass were scraped live from `app.interakt.ai/contacts/list`'s own computed CSS (same DevTools-Protocol technique as the sidebar reskin) — title 16px/600/#222222, table header 14px/600/#0A0B10 no uppercase, body cells 14px/400/#222222, filter buttons `border-radius: 4px` + `border: 1px solid #D0D4E1`.

**Dev server hang (found + fixed):** partway through this pass the Leads page got stuck on its loading skeleton indefinitely. Diagnosed precisely, not guessed: an authenticated `fetch('/api/automation/leads')` from the browser timed out after 8s+, while the identical unauthenticated request via `curl` returned in 6ms (fails auth before ever touching the DB) — proving the server was accepting connections fine but hanging on the authenticated code path specifically, most likely a stuck Mongoose connection pool after a very long dev session with dozens of Turbopack Fast Refresh cycles. Confirmed with the user, then killed the `npm run dev` process tree (PIDs found via `Get-CimInstance Win32_Process`) and started a fresh instance — the hang was gone immediately after. Not a bug in any of the styling edits above (none of them touch data-fetching code); flagging here in case it recurs in a future long session, since the fix is "restart the dev server," not "find a code bug."
Related decisions: see DECISIONS.md 2026-09-11 leads-interakt-styling entry.

## 2026-09-11 — Sidebar reskin to Interakt's UI kit + touchscreen hover bug fix
Branch: saurabh
Files:
- `app/automation/components/layout/Sidebar.jsx` (white bg replacing `#F4F5F7`; collapsed rail now `position: fixed` with a layout spacer, so hovering it expands into a floating overlay without reflowing the page — mirrors Interakt's own collapsed-rail behavior; renders new `SidebarQuickLinks` above the groups)
- `app/automation/components/layout/SidebarItem.jsx` (icon always brand-teal `#1D4B3E` at rest — not just on active; active state is a solid edge-to-edge teal fill with near-white text, no rounding/no accent stripe; hover is a medium mint `#BAE0CF` fill with teal text — colors scraped live from `app.interakt.ai`'s own computed CSS via DevTools Protocol)
- `app/automation/components/layout/SidebarSection.jsx` (group headers restyled from a small uppercase-caps label to a full nav-row: icon + normal-case label + trailing chevron, same size as a leaf item — matches Interakt's "Market/Support/Automation" rows, not its "QUICK LINKS" divider style; open/closed is click-only via the chevron, no hover-to-toggle; the open panel's mint background is one continuous rect spanning the header + items with no gap between them)
- `app/automation/components/layout/SidebarQuickLinks.jsx` (new — static "Quick Links" strip: Dashboard/Leads/Inbox, always open, no chevron, matching Interakt's own Quick Links pattern)
- `app/automation/components/layout/SidebarHeader.jsx` (white bg; removed the "CRM Management" subtitle under the wordmark)
- `app/automation/components/layout/WorkspaceSwitcher.jsx` (avatar/accent recolored from emerald to the same brand teal)
- `app/automation/components/layout/constants.js` (nav fully regrouped/renamed per explicit spec: `CRM/Communication/Insights/Settings/Support` → `Overview, Sales, Communication, Automation, Insights & AI, Workspace`; several items renamed — Deal Pipeline→Sales Pipeline, Automation Rules→Automations, Meetings & Scheduling→Meetings, Automation Analytics→Automation Performance, Events & Sessions→Activity & Events, Team & Permissions→Team & Access, Guide→Help Center; every item's `id`/href/icon/badge/role is unchanged — only `name` and group membership moved, since `id` is the key existing per-tenant `navAccess` locks are stored under; added a lucide `icon` per group for the new header style; removed the unused per-category `NAV_GROUP_TONES` now that the whole nav is monochrome teal)
- `lib/help/...` not touched this entry — scope was the automation app shell only

**Touchscreen hover bug (found + fixed, broader than the sidebar):** mid-session the user reported hover wasn't working; traced it to `window.matchMedia('(hover: hover)').matches === false` on their device (a touchscreen laptop — Tailwind wraps every `hover:` utility in `@media (hover: hover)`, which several touchscreen/2-in-1 Windows laptops report as false even with a physical mouse actively driving the pointer). Fixed in the sidebar by switching from Tailwind's `hover:` variant to `onMouseEnter`/`onMouseLeave`-driven React state in `SidebarItem.jsx` and `SidebarSection.jsx`. Grepped the rest of the app for the specific `opacity-0 group-hover:opacity-100` "hover-to-reveal" pattern (used to hide row-action icons until hover) and found it in 30 files — this means those icons never appear at all for this user anywhere they're used. Fixed the CRM list-row siblings while in the area:
- `app/automation/components/leads/LeadRow.jsx`, `LeadActionsMenu.jsx` (row action icons + the "⋯" menu trigger — were fully invisible, not just delayed)
- `app/automation/components/contacts/ContactRow.jsx`, `deals/DealRow.jsx`, `companies/CompanyRow.jsx`, `tasks/TaskRow.jsx` (same `opacity-0 group-hover:opacity-100` "⋯" menu / quick-action pattern, same mechanical fix — always-visible now)
The remaining ~24 files with this pattern (chat, forms, sequences, agency pages, templates, etc.) are NOT fixed — out of scope for this session, flagged here so a future pass can sweep the rest.

**Leads table:** removed the Follow-up and Message columns from `app/automation/components/leads/constants.js`'s `TABLE_COLUMNS` and their `<td>`s in `LeadRow.jsx` (per explicit ask, matching Interakt's Contacts table's leaner column set) — no data model change, just fewer columns rendered.
Related decisions: see DECISIONS.md 2026-09-11 sidebar-interakt-reskin and touchscreen-hover-media-bug entries.

## 2026-09-10 — New-lead sound notification: fill gaps + fix realtime pub/sub bug
Branch: saurabh
Files:
- `lib/realtime/hub.js` (root-cause fix — pinned the in-process `EventEmitter` singleton to `globalThis` instead of a plain module-scope `const`)
- `lib/omnichannel/customerMatching.js` (`matchCustomer` now emits `LEAD_UPDATED action:'created'` itself, right after creating a lead — centralizes the notification for WhatsApp, Instagram DM, Instagram comment, and Gmail inbound, all of which create leads through this one shared function)
- `lib/automation/leadManager.js` (removed the WhatsApp-path's own duplicate `action:'created'` emit — now redundant since `matchCustomer` fires it — and narrowed the remaining emit to only the existing-lead-plus-ad-referral case, relabeled `action:'updated'` so it silently refreshes the grid without chiming, since that's not actually a new lead)
- `lib/leadProcessor.js` (`ingestLead` — the "MANDATORY: every lead must pass through this" central engine — now emits on the new-lead branch; covers manual "+ Add Lead", `/api/forms/submit`, and any future caller)
- `app/api/website-funnel/leads/route.js`, `lib/meetings/crmSync.js`, `app/api/automation/whatsapp-flows/webhook/[secret]/route.js` (three more standalone `Lead.create` paths that bypass both `ingestLead` and `matchCustomer` — added the same emit directly)

What changed: the user asked for a beep whenever a lead is added. A sound system already existed (`lib/notifications/soundPlayer.js`'s `playLeadChime()`, wired into `useAppNotifications.js`, mounted globally via `NotificationsHost` in the automation layout) — but only the WhatsApp inbound-message path actually fired the `LEAD_UPDATED` realtime event that triggers it. Manual "Add Lead", form submissions, website-funnel captures, meeting-booking lead creation, Instagram, Gmail, and the WhatsApp Flows webhook never fired it. Traced every `Lead.create` site in the codebase and added the emit to each one that represents a genuine new lead (deliberately skipped CSV bulk-import — a 200-row import chiming 200 times is not what anyone wants — and the agency-client leads route, which isn't tied to a `business._id` realtime channel).

While verifying live (direct SSE listener + a POST to `/api/automation/leads`), discovered the emit call was firing correctly but the event never reached the browser at all — not even for the pre-existing WhatsApp path. Isolated it with a throwaway debug route publishing directly to `lib/realtime/hub.js`: a route that only *publishes* and a route that only *subscribes* were not sharing the same in-process `EventEmitter`. Root cause: this dev environment has no `REDIS_URL` configured, so the hub falls back to an in-process bus, and Next.js/Turbopack can give the same source module a separate instance per route-handler bundle — so `publishEvent` (one route) and `subscribe` (a different route) were operating on two different `EventEmitter` objects. Fixed by pinning the bus to `globalThis`, which is immune to per-bundle module duplication. Re-verified with the same debug route (event now arrives) and cleaned up all test leads/debug files afterward. This fix benefits every realtime event in the app (chat messages, bill-paid, task updates), not just leads — it was silently broken for all of them in any environment without Redis configured.
Related decisions: see DECISIONS.md 2026-09-10 lead-notification-coverage and realtime-hub-globalthis entries.

## 2026-09-09 — Help Center: drop "Start here" checklist, add photo hero banner
Branch: saurabh
Files:
- `app/help/HelpCenterClient.jsx` (removed the "Start here" onboarding checklist section and its now-unused `StartHereChecklist`/`START_HERE_CHECKLIST` imports; hero rebuilt as a photo banner — full-bleed `object-cover` image with a dark gradient overlay for legibility, white heading/subtitle text, and the search input as a floating white card overlapping the banner's bottom edge, matching the classic Zendesk/Freshdesk-style help-center hero)
- `app/help/StartHereChecklist.jsx` (deleted — orphaned once its only call site was removed; confirmed via repo-wide grep no other file imported it)
- `lib/help/guides.js` (removed the now-unused `START_HERE_CHECKLIST` export; `storage.js`'s generic `toggleChecklistItem`/`getGuideProgress` helpers were left in place — they're general-purpose and unrelated to this specific checklist)

What changed: per explicit user request, removed the onboarding progress checklist from the Help Center index (it was the "Start here 👋 · 5/6 completed" card with the 6-item list) and added a real photographic banner at the top of the hero. Image is a free-license Pexels photo (`images.pexels.com/photos/8192185/...`, Pexels License — free for commercial use, no attribution required), fetched and verified via curl before wiring in. Rest of the page stays fully white below the banner.
Related decisions: see DECISIONS.md 2026-09-09 help-center-docs-redesign entry (image sourcing note added there).

## 2026-09-09 — Help Center redesigned as Stripe/Mintlify-style documentation
Branch: saurabh
Files:
- `app/help/[slug]/GuideToc.jsx` (new — sticky right-rail "On this page" navigator; IntersectionObserver-based scroll-spy highlights the active section, click smooth-scrolls + updates the URL hash, no scroll-event polling)
- `app/help/[slug]/page.js` (rebuilt: dark marketing hero replaced with a white top bar + breadcrumb + plain header; body now a two-column docs layout — reading column (max-w-720px) + sticky `GuideToc` rail; every section (`overview`, `prerequisites`, each `step-N`, `tips`, `common-issues`, `related`) carries a matching `id` + `scroll-mt-20` that `GuideToc` watches; font weights pulled back from bold/extrabold to medium/semibold; all `dark:` variants stripped so the page renders white regardless of the site's global theme toggle)
- `app/help/StepVisuals.jsx` (dropped all `dark:` variants; step mockup cards — browser bar, form, WhatsApp bubble, checklist, nav highlight, payment link, bill card — restyled with a consistent layered shadow (`shadow-[...]` + `ring-1 ring-slate-200`) so they read as crisp inline "product screenshots" against the white page)
- `app/help/HelpCenterClient.jsx` (index page: dark dot-grid hero replaced with a plain top bar + light `slate-50` hero band; search input restyled as a bordered white field instead of a shadow-heavy pill on black; `FeaturedGuide`/`GuideCard`/search-results headings pulled back from bold to medium/semibold; dark `slate-900` `SupportCallout` band converted to a light bordered card; all `dark:` variants stripped)
- `app/help/StartHereChecklist.jsx`, `app/help/FeatureTours.jsx`, `app/help/RecentAndPopular.jsx` (stripped remaining `dark:` variants for consistency with the now fully-white Help Center)

What changed: rebuilt the Help Center to match the "professional documentation site" reference the user linked (interakt.shop's WhatsApp API guide) — fully white theme, restrained font weights, and a Stripe/Mintlify-style right-side "On this page" table of contents on every guide that scroll-spies as you read and smooth-scrolls when clicked. Every one of the 26 guides gets this automatically since it's the shared `[slug]/page.js` template. Images stayed as the existing hand-built UI mockups (browser chrome, WhatsApp bubbles, nav highlights, bill cards) rather than real app screenshots — restyled to look like crisp inline product screenshots — per explicit user choice over scraping the live app. Verified live in Chrome: scroll-spy correctly tracks section changes while scrolling, clicking a ToC entry (tested via dispatched click on "Related guides") smooth-scrolls and updates both the active highlight and the URL hash, and both `/help` and `/help/getting-started` render with no console errors.
Related decisions: see DECISIONS.md 2026-09-09 help-center-docs-redesign entry.

## 2026-09-09 — Tour popup light theme + Grovia FAB icon-only
Branch: saurabh
Files:
- `app/automation/components/shared/tour/TourOverlay.jsx` (spotlight tour popup switched from dark `glass-dark`/white-text to light `glass-panel`/slate-text "classic" card; dropped the Sparkles icon next to the step-count label, now plain uppercase text; progress dots, Back/Skip/Next buttons and links recolored for a light surface)
- `app/automation/components/assistant/BusinessAssistantFab.jsx` (Grovia floating action button reduced from an icon+name+tagline pill to an icon-only `w-11 h-11` circle — same footprint as the `HelpLauncher` compass button it sits below — with a native `title` tooltip replacing the dropped text; removed now-unused `ASSISTANT_TAGLINE` import)

What changed: user feedback on the just-shipped onboarding pass (screenshots of the Leads tour popup and the Grovia FAB) asked for the tour card to be a plain white/light "classic" card with no icon on the label, and for the Grovia FAB to drop its text and become icon-only at the same size as the neighboring help button. Both addressed directly; `BusinessAssistantTrigger` (the compact header variant, unrelated to the floating FAB) was left untouched.
Related decisions: none — straightforward visual-only change, no new pattern introduced.

## 2026-09-09 — Product-wide onboarding, contextual help & UX polish pass
Branch: saurabh
Files (new):
- `app/components/ui/HelpHint.jsx` (reusable ⓘ tooltip — accessible, keyboard-focusable, glass-styled popover)
- `app/automation/components/shared/tour/storage.js` (flat localStorage helpers for tour/intro completion + Guide progress/recent-guides)
- `app/automation/components/shared/tour/TourProvider.jsx` + `TourOverlay.jsx` (reusable spotlight product-tour engine — Next/Back/Skip/progress dots/keyboard nav/auto-scroll-to-target, portal-rendered)
- `app/automation/components/shared/tour/useAutoStartTour.js` (fires a tour once per browser, first time a page's data is ready)
- `app/automation/components/shared/tour/PageIntro.jsx` + `AutoPageIntro.jsx` (one-shot dismissible "what is this page" banner, auto-resolved from the route via a registry — zero-prop drop-in per page)
- `app/automation/components/shared/tour/registry.js` (single source of truth: 3 full spotlight tours — Dashboard, Leads, Automation Rules — + 25 lightweight page intros, each with copy + guide deep link)
- `app/automation/components/shared/tour/HelpLauncher.jsx` (persistent "Need help?" floating button — Search Guide / Restart this page's tour / Browse all guides / Contact support — parked above the existing Grovia FAB with a clear gap so neither overlaps)
- `app/automation/components/shared/tour/DiscoveryLink.jsx` (small cross-page "did you know" nudge, e.g. Leads → Create Automation)
- `app/help/StartHereChecklist.jsx`, `RecentAndPopular.jsx`, `FeatureTours.jsx`, `TrackGuideView.jsx` (Guide/Help Center additions — onboarding progress tracker with persisted checkboxes, recently-viewed + popular guides, a "restart a tour" list, and view tracking for the detail page)

Files (modified — highlights):
- `app/automation/layout.js` — mounts `TourProvider` + `HelpLauncher` globally (purely additive wrap, no existing behavior changed)
- `app/automation/components/automation/CreateAutomationModal.jsx` + `constants.js` (new `AUTOMATION_TEMPLATES`) — rebuilt as a two-step flow: a template gallery with WHEN/THEN visual cards (5 templates, mapped to the existing fixed trigger→action types) or "Build from scratch", then the create form with contextual ⓘ hints
- `app/automation/components/automation/{AutomationHeader,AutomationList,AutomationSettingsPanel,ChannelSelector}.jsx` — "Learn how automations work" link, richer first-run empty state with CTA, ⓘ hints on Channel + Trigger, tour target attributes
- `app/automation/page.js`, `leads/page.js`, `automation-rules/page.js` — wired the three full spotlight tours (`useAutoStartTour`) + `data-tour` targets
- 21 other page/workspace files (deals, pipelines, bills, tasks, companies, contacts, sequences, whatsapp-flows, broadcasts, journeys, meetings, templates, whatsapp-templates, chatbot, forms, call-integration, automation-analytics, events, ai/knowledge, settings/ai, settings/team-permissions, settings/integrations, settings) — each gets one `<AutoPageIntro />` drop-in
- `app/automation/components/dashboard/premium/{LeadsManagementCard,RetentionChartCard}.jsx`, `automation/broadcasts/page.js`, `ai/knowledge/page.js` — empty states rewritten to be actionable (title + why-it-matters + CTA button) instead of a bare "No X yet" line
- `app/automation/settings/integrations/page.js` — added a page title + description; this page previously had no heading explaining what it does at all
- `lib/help/guides.js` — added 3 categories (CRM / AI / Insights) and 15 new guide articles (Leads, Companies & Contacts, Deals & Pipelines, Tasks, WhatsApp Flows, Customer Journeys, Meetings, Chatbot, Forms, Call Recovery, AI Knowledge, AI Settings, Reports & Analytics, Integrations, Account Settings) plus a `START_HERE_CHECKLIST` export; 11 pre-existing guides untouched
- `app/help/HelpCenterClient.jsx`, `app/help/[slug]/page.js` — wired in the new categories/components
- `app/globals.css` — added a "Product tour / onboarding / glass design language" block: `fadeIn`/`lfg-tour-pop`/`lfg-spotlight-pulse` keyframes, `.glass-panel` / `.glass-dark` / `.glass-card` utilities

What changed: implemented the UX-IMPORVE.TXT brief end-to-end — a reusable spotlight ProductTour engine (used on Dashboard, Leads, and Automation Rules, matching the brief's own example almost verbatim), a lightweight PageIntro banner auto-wired onto every other major page via a central registry, a persistent Guide-aware help launcher that never collides with the existing Grovia assistant, an Automation Rules template gallery (the brief's priority area) with WHEN/THEN visual cards and contextual ⓘ hints, 15 new Guide articles covering every previously-undocumented sidebar section plus a "Start here" progress checklist / recently-viewed / popular-guides / restart-a-tour surface on the Help Center, and an actionable-empty-state pass across the dashboard, AI Knowledge, and Broadcasts. Verified live in Chrome against the real Pistons Garage workspace data (full tour flow, template gallery, HelpHint tooltips, Guide checklist persistence, and ~10 pages' intros/empty-states) with no console errors. Not done: a true drag-and-drop trigger/condition/action visual builder for Automation Rules (the backend only supports 5 fixed trigger→action types — building a real composable engine was out of scope for a UX pass and risked exactly the kind of backend rewrite the brief said not to do); the Inbox's three-pane layout was deliberately left without a PageIntro banner (too narrow to hold one without cramping the conversation list).
Related decisions: see DECISIONS.md 2026-09-09 entries.

## 2026-09-04 — Rich WYSIWYG signature editor + multi-signature per mailbox
Branch: feature/rich-signature-editor
Files:
- `app/automation/components/settings/RichSignatureEditor.jsx` (new — TipTap-based WYSIWYG editor with toolbar: bold/italic/underline/strike, text color picker, alignment, bullet & numbered lists, insert link, insert image via Cloudinary, S/M/L logo resize, clear formatting, live preview toggle)
- `app/automation/components/settings/signatureTemplates.js` (new — 4 email-safe table-based HTML templates: two-column with divider, logo on top, corporate, minimal text-only)
- `app/automation/components/settings/MultiSignatureEditor.jsx` (new — Hostinger-style manager: dropdown of saved signatures + Create new + rename + Delete + Make default + Save; embedded mode fires onChange live for use inside larger forms)
- `app/components/icons/AiBadgeIcon.jsx` (new — shared inline-SVG "AI" badge icon; black rounded box + white centered "AI" text + two gold sparkles)
- `models/omnichannel/EmailAccount.js` (added `signatures[]` sub-schema {id,name,html,isDefault,createdAt}; legacy `signature` string kept as fallback; new `resolveSignatureHtml(signatureId?)` instance method with priority order: signatureId → default → legacy → '')
- `app/api/automation/inbox/email-accounts/route.js` (POST accepts `signatures[]` on create; normalizes: exactly-one-default enforced, cap at 20, ids auto-generated)
- `app/api/automation/inbox/email-accounts/[id]/route.js` (PATCH whitelists `signatures[]` with same normalizer)
- `app/api/automation/inbox/send/route.js` (accepts `signatureId` from composer, forwards to sendChannelEmail)
- `lib/omnichannel/emailService.js` (uses `resolveSignatureHtml(signatureId)` for outbound signature; legacy signatureLogoUrl only prepended for plain-text legacy signatures)
- `app/automation/settings/email/page.js` (both Add flows — Gmail wizard + Custom IMAP/SMTP — use `<MultiSignatureEditor embedded>` for consistency; connected-account accordion uses standalone MultiSignatureEditor; SLA card badge redesigned with the new shared AiBadgeIcon)
- `app/automation/components/chat/ChatInput.jsx` (new signature-picker icon in composer toolbar for email channel; popover with radio list of signatures scoped to the current From mailbox; auto-picks the mailbox's default; passes signatureId through to send payload)
- `package.json` + `package-lock.json` (added TipTap v3.31.2: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-color, @tiptap/extension-text-style, @tiptap/extension-link, @tiptap/extension-image, @tiptap/extension-text-align, @tiptap/extension-placeholder, @tiptap/extension-table, @tiptap/extension-table-row, @tiptap/extension-table-cell, @tiptap/extension-table-header — all MIT-licensed)

What changed: replaced the plain textarea signature field with a WYSIWYG editor at Hostinger polish level. Users can now save multiple named signatures per mailbox ("Sales", "HR", "Personal") and pick which one to attach at compose time via a small pen-icon dropdown in the composer toolbar. Templates provide one-click professional signatures; the placeholder LOGO auto-swaps for the user's uploaded image via Cloudinary. Fully unified UX — the same MultiSignatureEditor UI appears in the Add SMTP/IMAP form, Gmail Connect wizard, and connected-account accordion, so there's no "wait, this looks different from before" moment after saving.

Design intent details:
- Custom Table/TableRow/TableCell TipTap extensions preserve `style`, `align`, `valign`, `width`, `bgcolor` attributes on parse+render (default TipTap only kept colspan/rowspan/colwidth) — needed so email-safe inline styles like `border-right: 2px solid ...` survive the round-trip through the editor.
- Image extension configured with `inline: true` + custom `width`/`height`/`style` attribute preservers so the S/M/L resize buttons + logo placement inside table cells work correctly.
- Signature templates use table-based HTML (not flex/grid) for cross-client rendering in Gmail/Outlook/Apple Mail.
- MultiSignatureEditor accepts a ref-stashed onChange in embedded mode to avoid infinite render loops from parent inline arrow callbacks.
- Signature preview panel matches how the signature actually renders in a real inbox: left-aligned at the bottom of the mock email body (not centered — that would mislead users about how recipients see it).

Related decisions: see DECISIONS.md 2026-09-04 signature editor entries.

## 2026-09-03 — Instagram comments: webhook ingestion + reply-from-inbox (Phase 1)
Branch: feature/whatsapp-templates-and-broadcasts
Files:
- `lib/instagram/handler.js` (added `parseInstagramChanges` + `processInstagramCommentEvent`; exported `IG_COMMENT_PARTICIPANT_PREFIX = 'ig_comment:'`; stores `metadata.lastCommentId` on Conversation for reply targeting)
- `lib/instagram/send.js` (added `sendInstagramCommentReply(business, commentId, text)` — POST to Graph API `/{comment_id}/replies`)
- `app/api/webhooks/meta/route.js` (extended the `payload.object === 'instagram'` branch to iterate `payload.entry[]`, process both `entry.messaging[]` for DMs and `entry.changes[]` for comments; returns processed count)
- `app/api/automation/inbox/send/route.js` (Instagram branch now detects `participantId.startsWith('ig_comment:')` and routes to `sendInstagramCommentReply` using `conversation.metadata.lastCommentId`; refuses media replies since Meta doesn't support them on comments)
- `lib/automation/triggerHub.js` (registered `instagram_comment` in `EVENT_TO_ENGINE_TRIGGER` and `EVENT_TO_SEQUENCE_TRIGGER`)
- `models/automation/AutomationSequence.js` (added `instagram_comment` to `triggerType` enum)
- `lib/sequences/constants.js` (added `trigger_instagram_comment` node + mapping in `TRIGGER_ENGINE_MAP`)

What changed: Instagram DMs were already ingested end-to-end. This session adds the comments half — public comments on IG posts now land in the Unified Inbox as their own conversations (one per commenter, keyed by `ig_comment:<commenterId>` so they never merge with the same person's DM thread), can be replied to from the composer (posts a nested reply via Meta's Graph API), and fire the `instagram_comment` automation trigger so sequences can react.

Scope deliberately excluded from Phase 1: an automated `send_instagram_comment_reply` sequence action (added to constants briefly then removed — no executor case yet); a comment→DM auto-response rule builder (Phase 2); an SLA safety-net auto-reply for DMs (Phase 3, will reuse the email pattern); a settings UI to onboard IG credentials (Pistons Garage's creds already live on `business.integrationCredentials.instagram`, so Phase 1 is unblocked without one).

Meta app config the tenant still needs (one-time, done on their side): add Instagram product to the shared app, connect a Business/Creator IG account linked to a Facebook Page, generate a Page Access Token with scopes `instagram_basic + instagram_manage_messages + instagram_manage_comments + pages_manage_metadata + pages_show_list`, and subscribe webhook fields `messages`, `comments`, `messaging_postbacks`, `mentions`. Webhook URL is the existing `/api/webhooks/meta` — Meta multiplexes WhatsApp + Instagram over the one endpoint.

Related decisions: see DECISIONS.md 2026-09-03 IG comment participant keying entry.

## 2026-09-03 — Prod fixes: cookie banner persistence + register rate limit
Branch: master
Files:
- `app/components/consent/CookieConsentManager.jsx` (persist consent to localStorage BEFORE the server audit call so it survives slow/failed network; added dismiss X on banner that counts as decline)
- `lib/rateLimit.js` (added `Retry-After` header + retry-window seconds in error body on 429)
- `app/api/auth/register/route.js` (loosen limit from 5/min to 10/min per IP, matches login)

What changed: two independent prod issues surfaced in Vercel logs. (1) The cookie consent banner reappeared on every visit because `saveConsentState` ran only after `await logConsentToServer()`; a slow or blocked audit call meant nothing was persisted. Made persistence optimistic — the choice is saved instantly on click and the audit log is best-effort in the background. (2) Register endpoint was returning 429 to a real user because the rate-limit was tighter than login's (5/min vs 10/min per IP) and a user retrying after a password-policy or "user already exists" 400 could exhaust the window. Bumped register to 10/min to match login and added a proper `Retry-After` header so the client can surface a specific wait time.

Related decisions: see DECISIONS.md 2026-09-03 register-rate-limit and cookie-persist entries.

## 2026-09-03 — Email SLA safety-net auto-reply (Step 9)
Branch: master
Files:
- `models/Business.js` (added `settings.emailAutoReply` sub-schema: enabled/thresholdMinutes/template/guardrails/telemetry)
- `models/omnichannel/Conversation.js` (added `autoReplyPaused`, `lastAutoReplyAt`)
- `lib/emailAutoReply.js` (new — worker function + scheduleAutoReplyForInbound helper; template-based, no AI call yet)
- `lib/queue.js` (new `enqueueEmailAutoReply` helper + `email-auto-reply` job branch in BullMQ worker)
- `lib/omnichannel/emailService.js` (`ingestInboundEmail` fires `scheduleAutoReplyForInbound` after inbound message is persisted; fire-and-forget, non-blocking)
- `app/automation/settings/email/page.js` (new `AutoReplyCard` + `AutoReplyConfig` components rendered above the accounts list)

What changed: shipped the SLA safety-net auto-reply. When a customer email arrives and no human replies within N minutes (default 5), a polite holding message goes out from the same mailbox the thread belongs to. Includes guardrails: business-hours-only, one-per-conversation, and skip-keyword blocklist (`angry`, `refund`, `cancel`, etc.). Reuses Step 8's `origin='automation'` provenance so auto-replies show the violet "Auto" pill in the inbox and don't fool the "Human replies" filter. Business-wide setting with per-conversation `autoReplyPaused` override for VIP threads.

Design intent: template + variable substitution instead of a real AI call for v1. Reasons: reliability (no hallucination risk on outbound customer email), no API-key dependency, hot-swappable by replacing `renderTemplate()` inside `runAutoReplyJob` when we're ready for AI. The plumbing is designed so swapping in an AI provider later doesn't touch call sites.

Related decisions: see DECISIONS.md 2026-09-03 auto-reply entry.

### Prior undocumented work observed on this branch (2026-08-30 to 2026-09-02, inherited)
The working tree had a large multi-user email feature already built across ~15 files before this session logged its first entry. Confirmed from the modified/untracked file list — matches an "Option A" implementation: per-user `EmailAccount` with encryption at write, Gmail App-Password wizard, `sendChannelEmail` builds per-account Nodemailer transports, IMAP sync cron at `app/api/cron/email-sync`, threading via In-Reply-To / References headers, `origin` provenance on Message + `lastMessageOrigin` cache on Conversation, folder tabs wired end-to-end with per-message star/trash actions, compact composer collapse-when-idle, signature + logo (Cloudinary upload OR URL paste), sidebar unread-badge fix, reply-timing SLA pill on conversation cards, draft auto-save, snooze presets, keyboard shortcuts (j/k/e/s/#/?), and real-time SSE user signals (live green dot, toast on incoming, opt-in sound).

None of that work has its own log entry — this line is the paper trail. Future sessions modifying any of those areas should confirm intent with the user before further changes.

---

## 2026-09-03 — Set up CLAUDE.md and DECISIONS.md
Branch: feature/whatsapp-templates-and-broadcasts
Files: `CLAUDE.md` (new), `DECISIONS.md` (new)
What changed: Created this change log and the companion decisions log at the user's request. Going forward, every change made in this repo is recorded here, and every non-trivial decision is recorded in `DECISIONS.md`.
Related decisions: see DECISIONS.md 2026-09-03 entry.

### Branch state observed at setup time (not made by this session)
The working tree already had substantial uncommitted changes on this branch before this session started, in the omnichannel inbox / email-sync area:
- Modified: `app/api/automation/inbox/{conversations,email-accounts,send}/route.js`, most of `app/automation/chat/*` and `app/automation/hooks/{useChatInbox,useSidebar}.js`, `app/automation/settings/email/page.js`, `lib/automationEngine.js`, `lib/broadcasts/engine.js`, `lib/integrations/email.js`, `lib/meetings/email.js`, `lib/omnichannel/{conversationService,emailService,emailSync}.js`, `lib/sequences/executor.js`, `models/automation/Message.js`, `models/omnichannel/{Conversation,EmailAccount}.js`, `app/components/landing/CustomerJourneySection.jsx`.
- New, untracked: `app/api/automation/inbox/email-accounts/[id]/`, `app/api/automation/inbox/messages/[id]/`, `app/api/cron/email-sync/`, `lib/omnichannel/mailerFromAccount.js`.
- This looks like an in-progress IMAP/email-account sync + unified inbox feature layered on top of the WhatsApp templates/broadcasts work already on this branch (see project memory `project_known_issues.md`). Not yet reviewed or attributed to a specific prior session in this log — first change to that area in a future session should confirm intent before modifying further.
