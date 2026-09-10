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
