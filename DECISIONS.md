# DECISIONS.md — Decisions Log

This file records every non-trivial decision made by Claude Code while working in this repo, in reverse-chronological order (newest first). "Non-trivial" means: a choice between two or more reasonable approaches, a tradeoff, a deviation from an obvious/default path, or anything a future session would need context to avoid re-litigating or reversing by accident. See `CLAUDE.md` for the plain change log.

Entry format:
```
## YYYY-MM-DD — short title
Context: <what prompted the decision>
Decision: <what was decided>
Alternatives considered: <other options and why they were passed over>
Consequences: <what this commits future work to, if anything>
```

---

## 2026-09-09 — Help Center docs redesign: mockup visuals over real screenshots, one shared template
Context: User asked for a "fully professional" Help Center matching Stripe/interakt.shop-style documentation, with "quality images" and a right-side auto-scrolling table of contents. Two genuinely different interpretations of "quality images" existed with very different cost: (a) restyle the existing hand-built UI mockups, or (b) capture real screenshots of the live app for every step of all 26 guides. Asked the user directly rather than guessing, given the scope gap.
Decision: User chose (a) — polished mockup cards, no real screenshots — and confirmed the redesign should cover both the guide detail template (`[slug]/page.js`) and the Help Center index (`HelpCenterClient.jsx`). Built one shared `GuideToc` client component (IntersectionObserver scroll-spy + smooth-scroll) used by the single guide-detail template, so the right-rail ToC and white-documentation styling apply to all 26 guides automatically rather than needing per-guide work.
Alternatives considered: Real screenshots for a curated subset of high-traffic guides — offered as a third option but not chosen. Per-guide custom layouts — rejected as unnecessary; the data-driven `guides.js` + shared template already generates all 26 pages, so redesigning the template was sufficient and consistent.
Consequences: If real product screenshots are wanted later, they'd slot into the existing `StepVisual` cases (or a new `kind: 'screenshot'` case) without touching `GuideToc` or the page layout. The `dark:` Tailwind variants were removed from every file touched in `app/help/` (not the rest of the app) so this section renders white regardless of the site's global light/dark toggle — any future dark-mode work on the Help Center needs to reintroduce `dark:` classes deliberately rather than assuming they're already there.

## 2026-09-09 — Automation builder stays template-driven, not a real visual composer
Context: UX-IMPORVE.TXT section 11 asks for a visual WHEN/IF/THEN drag-drop automation builder. Investigating the backend showed `AutomationRule` only supports 5 fixed trigger→action pairs (`instant_acknowledgement`, `notify_team`, `auto_assign`, `follow_up_reminder`, `lost_lead_reengagement`) — there is no generic trigger/condition/action composition engine to build a UI on top of.
Decision: Built the "template gallery" the brief also asks for, using the 5 real fixed types, each rendered as a WHEN→THEN visual card with real copy — not a fake drag-and-drop canvas that doesn't actually compose anything. `CreateAutomationModal` is a genuine two-step flow (pick a template or start from scratch → name/describe it) that accurately represents what the backend can do.
Alternatives considered: (a) Build a real composable trigger/condition/action engine — rejected, this is a multi-week backend project (new schema, new executor, migration of 4 existing rule types), and the brief explicitly says "do not rewrite the entire application unnecessarily" / "do not change APIs without necessity". (b) Build a visual canvas UI that LOOKS like drag-and-drop but only ever produces one of the 5 fixed types under the hood — rejected as actively misleading; a user would drag nodes expecting composition and get a fixed template regardless.
Consequences: If real composable automations are wanted later, the template gallery's `AUTOMATION_TEMPLATES` metadata (WHEN/THEN copy per type) can be reused as the seed data for a real builder — this session did not block that path, just didn't fake it.

## 2026-09-09 — Product tours are opt-in-once, not forced, and live client-side only
Context: Brief wants "first-time tooltips... don't create annoying popups everywhere" plus persistence and a restart mechanism.
Decision: All tour/intro completion state lives in flat `localStorage` (`lfg_tours_state_v1`, `lfg_intro_seen_v1`), matching every other UI preference in this codebase (see `useSidebar.js`, `useLeadsWorkspace.js`). No backend field, no per-user sync across devices.
Alternatives considered: Store "tours completed" on the User/Business document server-side — would sync across devices/browsers, but is unnecessary backend surface for a UI nicety, and every other onboarding-adjacent flag in this app (sidebar collapsed, etc.) is already client-only. Deferred until there's a real multi-device continuity complaint.
Consequences: A user who clears site data or switches browsers sees every tour/intro again once — treated as an acceptable, low-cost re-onboarding rather than a bug.

## 2026-09-09 — Three full spotlight tours, twenty-five lightweight intros
Context: Brief lists ~24 pages that need "at minimum" a tour, but also explicitly says "not every page needs a long tour... some can have a 2-step introduction... use judgment."
Decision: Built the full multi-step spotlight `ProductTour` (Next/Back/Skip, DOM-target spotlighting) for exactly the three pages the brief itself uses as worked examples or calls out as priority: Dashboard, Leads, Automation Rules. Every other page (Deals, Pipelines, Bills, Tasks, Companies, Contacts, Sequences, WhatsApp Flows, Broadcasts, Journeys, Meetings, Templates, WhatsApp Templates, Chatbot, Forms, Call Recovery, Reports, Automation Analytics, Events, AI Knowledge, AI Settings, Team, Integrations, Settings) gets the lighter `PageIntro` — a one-shot dismissible card with real per-page copy and a guide deep link, registered centrally in `registry.js`.
Alternatives considered: Full spotlight tours everywhere — rejected as exactly the "annoying popups everywhere" the brief warns against, and most of these pages have a single obvious primary action that a one-line explanation already covers. Nothing (skip entirely on lighter pages) — rejected, fails the "first-time users understand major features" acceptance criterion.
Consequences: The `registry.js` `TOURS` map is the only place that needs a new entry if a future page earns a full spotlight tour later; `INTROS` is the array to extend for anything lighter.

## 2026-09-09 — HelpLauncher is a separate floating button, not merged into Grovia
Context: Brief section 16 explicitly says the new help entry point "should NOT interfere with the existing chatbot / Grovia UI."
Decision: New circular "Need help?" button at `bottom-[104px] right-6` (fixed), sitting directly above the existing Grovia FAB (`bottom-6 right-6`) with enough vertical gap that the two never overlap at any observed viewport. Its popover (search Guide / restart this page's tour / browse guides / contact support) is a separate small panel, not a tab inside Grovia's UI.
Alternatives considered: Add a "Help" tab inside the Grovia panel — rejected, would require modifying `BusinessAssistantRoot`/Grovia's own component, which the brief's "respect the current application architecture" instruction argues against touching for an unrelated feature.
Consequences: Two floating affordances now stack in the bottom-right corner on every automation page. If a third is ever added, the stacking offsets in `HelpLauncher.jsx` (`bottom-[104px]`, popover `bottom-[172px]`) need to shift up accordingly.

## 2026-09-09 — Inbox gets no PageIntro banner
Context: Auditing the Inbox (`/automation/chat`) for a first-time explanation card like every other page got.
Decision: Left the Inbox out of the `INTROS` registry (no `AutoPageIntro` rendered there). The conversation-list sidebar is a narrow ~300px column and the main pane is a live chat surface — a banner has nowhere to sit without covering the sidebar's own "Unified Inbox" header or shrinking the message list below a usable size.
Alternatives considered: Force it in above the ChatSidebar header anyway — rejected after checking the actual rendered width; it would visibly cramp the one part of the page (the conversation list) that needs the most vertical room.
Consequences: Inbox first-time users rely on the Guide's "Inbox" article (already existed pre-session as `inbox-basics`) and the sidebar's own `NotificationsHost` real-time cues rather than an in-page tour. If the Inbox layout is ever reworked with more header room, revisit.

## 2026-09-04 — Signature editor: TipTap over contenteditable / textarea
Context: The signature field was a plain `<textarea>` and users wanted a Hostinger-polish WYSIWYG (toolbar, live preview, embedded logo, template picker). Three build paths were on the table.
Decision: TipTap v3.x with a small suite of MIT-licensed extensions (StarterKit, Color, TextStyle, Link, Image, TextAlign, Placeholder, Table + TableRow/Cell/Header). ~50KB gzipped. Same editor Notion / Linear / Cal.com / Vercel dashboard use.
Alternatives considered:
  (a) `contenteditable` + `document.execCommand` — same amount of code, but built on an API browsers are actively deprecating; no future upgrade path.
  (b) A commercial WYSIWYG SDK (TinyMCE, CKEditor) — feature-rich but paid/attribution-required for commercial use, adds ~200KB+, brand marks on the editor.
  (c) Stay on textarea — misses the "Hostinger-quality" ask entirely.
Consequences: TipTap's default schemas are minimal — the table extensions only preserve colspan/rowspan/colwidth attributes, dropping style/align/valign/width/bgcolor silently. We had to author custom Table/TableRow/TableCell extensions that whitelist the extra HTML attrs so inline-styled email-safe templates survive parse+render. Any future template that adds new HTML attrs needs to extend this whitelist. This is documented at the top of RichSignatureEditor.jsx.

## 2026-09-04 — Multi-signature: array on EmailAccount + composer picker, not separate collection
Context: Users wanted Hostinger-style multi-signatures per mailbox: create "Sales", "HR", "Personal", pick one as default, override at compose time.
Decision: Extended `EmailAccount` with a `signatures[]` sub-schema `{id, name, html, isDefault, createdAt}` — kept the legacy `signature` string field as a fallback for old rows. Added a `resolveSignatureHtml(signatureId?)` instance method that encapsulates the priority order (explicit id → default → legacy → '') so callers don't duplicate the resolution logic. Composer picker sends `signatureId` on send; server resolves via that method.
Alternatives considered:
  (a) New Mongo collection `EmailSignature` with `emailAccountId` FK — cleaner normalization but adds a join on every outbound send. Not worth it for typically 1-5 signatures per mailbox.
  (b) Just add `additionalSignatures[]` alongside the legacy `signature` field — leaves two sources of truth for "what's the default", constantly confusing.
Consequences: Migration is transparent — a `MultiSignatureEditor` mount on a mailbox with `signatures: []` but a legacy `signature` string synthesizes one entry named "Default" so users never lose existing content. Backend PATCH/POST endpoints enforce invariants server-side (exactly-one-default, max 20 entries, ids auto-generated) since the client is untrusted. The `signatures[]` schema is deliberately lightweight — no versioning, no ACL, no template-vs-instance distinction. If those needs materialize, they layer on additively.

## 2026-09-04 — Unified MultiSignatureEditor UI in Add flow AND connected accordion
Context: The Add SMTP/IMAP form originally used the single RichSignatureEditor while the connected-account accordion used the full MultiSignatureEditor. That created two different UIs for the same conceptual task.
Decision: MultiSignatureEditor grew an `embedded` prop. Standalone mode (default) keeps its own draft state + Save button. Embedded mode hides Save and fires `onChange(signatures)` on every mutation so the parent form (Gmail wizard / Custom IMAP add form) owns the signatures state and includes them in its own submit payload. Same UI everywhere.
Alternatives considered:
  (a) Keep the split (simpler add form, richer connected accordion) — rejected: inconsistency is a real UX cost per Nielsen heuristic #4, and users who wanted 2 signatures on day 1 had to save-then-come-back.
  (b) Remove signature from add form entirely (Gmail/Outlook pattern) — rejected: extra clicks to finish setup, and new mailboxes would send with no signature until user hunted for the settings.
Consequences: The `onChange` prop in embedded mode is called with the full signatures array on every state change. To avoid infinite render loops from parents passing inline arrow callbacks (`onChange={(s) => setForm({...form, signatures: s})}` — new function every render), MultiSignatureEditor stashes `onChange` in a `useRef` and only depends on `signatures` in the useEffect. Any future component using this callback-fires-on-state pattern should copy the ref approach.

## 2026-09-03 — IG comments: separate Conversations from DMs, keyed by prefix
Context: Instagram sends DMs and public post comments to the same webhook. The Conversation model has a unique index on `(businessId, participantId, channel)`, so if we used the raw commenter IG user id as `participantId` for both DMs and comments, a person who both DM'd us and commented on a post would collapse into one Conversation. That's bad for two reasons: (1) reply endpoint differs — DMs go to `/{ig_user_id}/messages`, comments to `/{comment_id}/replies`; (2) the composer would have no way to tell them apart, so agents replying to a comment thread would accidentally send a DM instead.
Decision: Comment conversations get a prefixed participantId: `ig_comment:<commenterId>`. DM conversations keep the raw `<igUserId>`. The two threads coexist for the same person. The send route detects the prefix and dispatches to the right Meta endpoint. The specific comment id to reply to is stored on `conversation.metadata.lastCommentId` by the webhook handler, so the send route doesn't need to walk Messages to find it.
Alternatives considered: (a) Add a `channelSubtype: 'dm'|'comment'` field on Conversation and index `(businessId, participantId, channel, channelSubtype)` — cleaner schema but requires a migration and every existing IG query in the codebase to be updated to filter by subtype (they all currently assume `channel: 'instagram'` means DM). Deferred until we have a broader multi-subtype channel need. (b) Extend the enum to `instagram_comment` — would break anywhere that does `channel === 'instagram'` (there are call sites in the composer, send route, and integrations). Rejected as too risky for Phase 1.
Consequences: `participantId` for IG comment threads is a synthetic prefixed string, not a real IG identifier. Anything that treats participantId as an IG user id (e.g., cross-linking to Meta APIs directly) needs to strip the prefix first. `IG_COMMENT_PARTICIPANT_PREFIX` is exported from `lib/instagram/handler.js` — always use that constant, don't hardcode `'ig_comment:'` at call sites. Also: media replies to comments are refused (400) because Meta doesn't support them on the comments API; the send route surfaces this rather than silently dropping the media.

## 2026-09-03 — Cookie consent: persist locally BEFORE the server audit call
Context: The cookie banner was reappearing on every page visit even after users clicked Allow/Decline. Root cause: `saveConsentState()` ran inside the `try` block **after** `await logConsentToServer()`. If the server call was slow, timed out silently, or the tab was closed mid-request, `localStorage` was never written and the banner returned on next load. The `catch` branch also saved, but only if the fetch actually rejected.
Decision: Made persistence optimistic. `saveConsentState()` and all UI state updates happen synchronously the moment the user clicks. The server audit call is now fire-and-forget in the background — failures log to console but do not affect UX.
Alternatives considered: (a) Keep the current order and just extend the fetch timeout — rejected because it doesn't fix tab-close-during-await. (b) Use `navigator.sendBeacon()` for the audit call so it survives page unload — cleaner but requires reworking the endpoint to accept beacon-encoded payloads. Deferred until we have a reason to touch the endpoint.
Consequences: If the audit log ever falls out of sync with actual user choices (server missed some Allow/Decline events), the local state is still authoritative. Analytics/consent reports may under-count decisions but never over-count.

## 2026-09-03 — Register rate limit: 10/min (was 5/min), matches login
Context: Prod Vercel logs showed `POST /api/auth/register` returning 429 for a real user attempt. The register endpoint had `withRateLimit(5, 60)` — tighter than login's `withRateLimit(10, 60)`. A user retrying after password-policy 400s or "user already exists" 400s can exhaust 5 attempts in 60s easily.
Decision: Bump register to `10/min` to match login. Also added `Retry-After` header and the retry window in the 429 body so the client can display "try again in ~60 seconds" instead of vague "later."
Alternatives considered: (a) Keep 5/min but skip failed-validation attempts in the counter — safer against brute force but adds enumeration risk (attacker can probe for valid emails without incrementing). (b) Move to per-IP+UA composite key to reduce NAT collisions — deferred; the 10/min bump likely resolves it without needing a keying change. (c) Add a CAPTCHA on 3rd+ attempt — good long-term, deferred until we see repeat abuse patterns.
Consequences: Signup endpoint is now 2× more permissive than before. If brute-force / signup-spam becomes a real problem, we escalate to a fingerprint-based key or add CAPTCHA. Login's limit remains 10/min for consistency; refresh is 20/min which is fine since refresh happens on real logged-in traffic only.

## 2026-09-03 — Email auto-reply v1 uses a template, not an AI call
Context: User asked to build an "AI auto-reply after 5 minutes" for the SLA safety net. Two flavors were on the table — (A) a holding message that just acknowledges receipt and sets expectation, (B) a full AI-generated answer using the knowledge base.
Decision: Shipped Flavor A with a mustache-style template + variable substitution. No AI provider call. Message goes out via the same `sendChannelEmail` pipeline as manual composer sends, tagged `origin='automation'` so it shows the "Auto" pill in the inbox.
Alternatives considered: (B) Full AI response — rejected for v1 because hallucinations on outbound customer email are brand-damaging in a way inbound triage isn't. The user's own KB isn't guaranteed to be complete either, so the AI would speculate on gaps. Deferred behind an explicit tenant opt-in for a future iteration.
Consequences: The plumbing (queue job, guardrails, per-conversation pause, template renderer) is designed so swapping `renderTemplate()` for an AI call is a one-function change — call sites don't need to know. Guardrails already exist (skip on angry/refund/cancel keywords, business hours only, one-per-conversation) which the AI flavor will need anyway.

## 2026-09-03 — Guardrails default: skip on negative sentiment keywords
Context: Auto-reply needs a way to avoid replying to angry / urgent / legally-sensitive messages, where a generic "we'll get back to you" is worse than silence.
Decision: Denylist-based keyword match on subject + body (case-insensitive, substring). Default list: `angry, refund, cancel, complaint, lawyer, sue, terrible, awful`. Match is deliberately eager — "cancellation" triggers on "cancel" — because a false positive here just means "human handles it," which is the safer failure mode.
Alternatives considered: Real sentiment analysis via AI — better precision but adds latency + API cost + a dependency. Deferred until keyword matching proves insufficient. Also considered per-tenant customization only (no defaults), rejected because most tenants won't discover this feature and would ship without guardrails.
Consequences: The default list is baked into the schema. Tenants can override in Settings → Email Accounts → Auto-Reply. Future AI sentiment classifier can layer on top without removing the keyword denylist.

## 2026-09-03 — Business-wide setting + per-conversation pause (not per-user)
Context: Ownership question — who controls the auto-reply behavior?
Decision: Business-wide toggle (all mailboxes on that tenant get the same rules) with an `autoReplyPaused` boolean override on each Conversation for one-off "VIP, don't auto-reply here" overrides.
Alternatives considered: Per-EmailAccount setting — would let Alice have auto-reply on and Bob off. Rejected because we have 2 users and the added complexity isn't warranted; also, mixed behavior on the same customer thread across users would be confusing.
Consequences: If a tenant later needs per-mailbox control, migration is additive (add `EmailAccount.autoReplyOverride` optional field, resolver picks account setting if present else falls back to business). No breaking change.

## 2026-09-03 — `onePerConversation` sets `autoReplyPaused=true` after firing
Context: We need to make sure the safety-net reply fires at most once per conversation, even if the customer sends a rapid follow-up.
Decision: After a successful auto-reply send, the worker sets `Conversation.autoReplyPaused = true` (in addition to updating `lastAutoReplyAt` for UI display). Belt-and-braces: the worker also independently checks `lastAutoReplyAt` on entry.
Alternatives considered: TTL-based cooldown (24h) — more forgiving for legitimate multi-day threads, but adds time-based logic that's harder to reason about. Rejected because the intent of a safety net is "one nudge, then let the human take over"; the human can un-pause the conversation if they want the safety-net to resume.
Consequences: If a tenant wants the safety net to fire multiple times per conversation, they uncheck the guardrail. The Conversation-level pause remains permanent until an agent flips it back.

---

## 2026-09-03 — Adopt mandatory change/decision logging
Context: User instructed that from now on, every change made in this repo must be recorded in `CLAUDE.md` and every decision taken must be recorded in `DECISIONS.md`, without exception, in every session.
Decision: Created both files at the repo root with a fixed entry format. This rule is now treated as a standing project convention: before ending any session that touched code or made a judgment call, append the corresponding entries to these two files.
Alternatives considered: A single combined log — rejected because the user explicitly asked for two separate files with distinct purposes (what changed vs. why).
Consequences: Every future session in this repo must update both files. If a session makes code changes but forgets to log them, that is a process failure to correct immediately, not a style choice.
