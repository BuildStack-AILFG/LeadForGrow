/**
 * Inbox list tweaks: channel filter icons only for channels in use; the
 * "New lead" button uses a person icon (it looked like "new chat").
 *
 * Run: node --test tests/inbox-channel-filters.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('channel filters', () => {
  it('the waiting-counts call also returns the channels a business has used', () => {
    const route = read('app/api/automation/inbox/channel-waiting/route.js');
    assert.match(route, /Conversation\.distinct\('channel', \{ businessId: user\.businessId \}\)/);
    assert.match(route, /data: byChannel, channels: channels\.filter\(Boolean\)/);
  });

  it('hides unused channels but never All, never before loading, never the active one', () => {
    const sidebar = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.match(sidebar, /f\.id === 'all' \|\| !usedChannels \|\| usedChannels\.includes\(f\.id\) \|\| channelFilter === f\.id/);
  });

  it('"New lead" uses a person icon', () => {
    const sidebar = read('app/automation/components/chat/ChatSidebar.jsx');
    assert.match(sidebar, /<UserPlus className="w-4 h-4" \/>/);
    assert.doesNotMatch(sidebar, /MessageSquarePlus/);
  });
});
