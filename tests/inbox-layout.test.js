/**
 * Unified Inbox layout decisions (list narrower, icon-only channel pills, closable + remembered profile panel).
 * These read the source because the pieces are React components; they guard the decisions against regressions.
 * Run: node --test tests/inbox-layout.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDeviceLevelKey } from '../lib/clientStorage.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const page = read('app/automation/chat/page.js');
const header = read('app/automation/components/chat/ChatHeader.jsx');
const panel = read('app/automation/components/chat/CRMProfilePanel.jsx');
const sidebar = read('app/automation/components/chat/ChatSidebar.jsx');

describe('conversation list width', () => {
  it('is 320 / 360 / 380 px (was 380 / 420 / 460, wider than the chat itself)', () => {
    assert.match(page, /lg:w-\[320px\] xl:w-\[360px\] 2xl:w-\[380px\]/);
    assert.doesNotMatch(page, /2xl:w-\[460px\]/);
  });
});

describe('channel pills', () => {
  it('are icon-only with an accessible name and tooltip (five labelled pills do not fit a narrow list)', () => {
    // Tooltip references the label (it may also append a live "N waiting" hint).
    assert.match(sidebar, /title=\{[^}]*f\.label/);
    assert.match(sidebar, /aria-label=\{f\.label\}/);
    // Only the channel pills block: the view tabs (Needs reply, Mine, ...) below it keep their text labels.
    const pills = sidebar.slice(sidebar.indexOf('CHANNEL_FILTERS.map'), sidebar.indexOf('<InboxViewTabs'));
    assert.ok(pills.length > 100, 'could not isolate the channel pills block');
    assert.doesNotMatch(pills, /^\s*\{f\.label\}\s*$/m, 'the visible text label must be gone from the pill');
  });
});

describe('customer profile panel', () => {
  it('can be closed on desktop (X is no longer overlay-only) and the choice is remembered', () => {
    assert.match(panel, /\{onClose && \(/);
    assert.doesNotMatch(panel, /\{mobile && onClose && \(/);
    assert.match(page, /onClose=\{\(\) => setCollapsed\(true\)\}/);
    assert.match(page, /localStorage\.setItem\(PROFILE_COLLAPSED_KEY/);
  });

  it('is open by default (collapsed only when the user closed it)', () => {
    assert.match(page, /useState\(false\);\s*\n\s*useEffect\(\(\) => \{\s*\n\s*try \{ if \(localStorage\.getItem\(PROFILE_COLLAPSED_KEY\) === '1'\)/);
    assert.match(page, /\{!profileCollapsed && \(\s*\n\s*<CRMProfilePanel/);
  });

  it('its preference key survives logout like theme and cookie choice', () => {
    const key = page.match(/PROFILE_COLLAPSED_KEY = '([^']+)'/)[1];
    assert.equal(isDeviceLevelKey(key), true, key);
  });

  it('opens from the header: customer photo/name and a toggle button that is always visible', () => {
    assert.match(header, /title="Customer profile"/);
    assert.doesNotMatch(header, /xl:hidden p-2 rounded-lg[^"]*"\s+title="CRM profile"/);
    assert.match(header, /aria-pressed=\{profileOpen\}/);
    assert.match(page, /onProfile=\{handleProfileToggle\}/);
  });
});

describe('chat wallpaper', () => {
  const css = read('app/globals.css');
  const list = read('app/automation/components/chat/MessageList.jsx');

  it('chat threads use the wallpaper in all three states (loading, empty, messages); email threads stay flat', () => {
    assert.match(list, /'chat-wallpaper'/);
    assert.equal((list.match(/\$\{surface\}/g) || []).length, 3);
  });

  it('light and dark variants exist, keep the old base colours, and use well-formed inline SVG tiles', () => {
    assert.match(css, /\.chat-wallpaper \{\s*background-color: #F1F6F3;/i);
    assert.match(css, /\.dark \.chat-wallpaper \{\s*background-color: #0b141a;/i);
    const tiles = [...css.matchAll(/\.(?:dark )?chat-wallpaper \{[^}]*?url\("data:image\/svg\+xml,([^"]+)"\)/g)].map((m) => decodeURIComponent(m[1]));
    assert.equal(tiles.length, 2);
    for (const svg of tiles) {
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
      assert.equal((svg.match(/<g[ >]/g) || []).length, (svg.match(/<\/g>/g) || []).length, 'unbalanced <g>');
      assert.match(svg, /stroke-opacity='0?\.0\d+'/, 'the pattern must stay faint (<10% opacity)');
    }
  });
});

describe('emoji picker', () => {
  const input = read('app/automation/components/chat/ChatInput.jsx');

  it('has its own width (regression: it collapsed to the 36px smile-button wrapper and the emojis overlapped)', () => {
    const popup = input.match(/className="(absolute bottom-full left-0 mb-2 [^"]*)"/)?.[1] || '';
    assert.match(popup, /\bw-\[288px\]/, 'the popup needs an explicit width');
    assert.match(popup, /border-slate-200 dark:border-slate-700/, 'explicit border colours for light and dark');
    assert.match(popup, /max-h-64 overflow-y-auto/, 'long lists must scroll, not grow off screen');
  });

  it('closes on an outside click and on Escape', () => {
    assert.match(input, /emojiRef\.current\.contains\(e\.target\)/);
    assert.match(input, /e\.key === 'Escape'\) setEmojiOpen\(false\)/);
  });

  it('offers grouped emojis with no duplicates inside a group and plain (non-empty) entries', async () => {
    const { register } = await import('node:module');
    register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
    const { EMOJI_GROUPS, QUICK_EMOJIS } = await import('../app/automation/components/chat/constants.js');
    assert.ok(EMOJI_GROUPS.length >= 4);
    assert.deepEqual(EMOJI_GROUPS[0].emojis, QUICK_EMOJIS);
    for (const g of EMOJI_GROUPS) {
      assert.ok(g.emojis.length >= 8, `${g.id} is too small to be worth a group`);
      assert.equal(new Set(g.emojis).size, g.emojis.length, `${g.id} has duplicates`);
      for (const e of g.emojis) {
        assert.ok(e && e.trim() === e, `${g.id}: empty or padded entry`);
        assert.doesNotMatch(e, /‍/, `${g.id}: ${e} is a ZWJ sequence (renders inconsistently)`);
      }
    }
  });
});

describe('dark mode: waiting badge + WhatsApp marks', () => {
  const item = read('app/automation/components/chat/ConversationItem.jsx');
  const leadHeader = read('app/automation/components/leads/detail/LeadDetailHeader.jsx');
  const leadProfile = read('app/automation/components/leads/detail/LeadDetailProfile.jsx');

  it('every waiting-time badge state sets BOTH a light and a dark background (the "2d" one had light text on a light pink pill)', () => {
    const states = [...item.matchAll(/cls = '([^']+)'/g)].map((m) => m[1]);
    assert.ok(states.length >= 4, 'expected the four waiting states');
    for (const cls of states) {
      assert.match(cls, /\bbg-[a-z]+-\d+/, `no light background: ${cls}`);
      assert.match(cls, /dark:bg-/, `no dark background: ${cls}`);
    }
  });

  it('the lead page WhatsApp buttons use the real WhatsApp mark, not a generic chat bubble', () => {
    for (const src of [leadHeader, leadProfile]) {
      assert.match(src, /<WhatsAppIcon className="w-4 h-4" \/>/);
      assert.doesNotMatch(src, /<MessageSquare\b/);
    }
  });
});
