/**
 * Email inbox fixes: flat background for email, no red badges on newsletters, no call button without a phone, and room for the
 * floating Help / Grovia buttons. Run: node --test tests/email-inbox.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAutomatedSender } from '../lib/omnichannel/automatedSender.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const list = read('app/automation/components/chat/MessageList.jsx');
const input = read('app/automation/components/chat/ChatInput.jsx');
const header = read('app/automation/components/chat/ChatHeader.jsx');
const item = read('app/automation/components/chat/ConversationItem.jsx');
const page = read('app/automation/chat/page.js');
const css = read('app/globals.css');

describe('isAutomatedSender', () => {
  const email = (address) => isAutomatedSender({ channel: 'email', email: address });

  it('flags newsletters, no-reply and notification senders', () => {
    for (const a of ['noreply@github.com', 'no-reply@accounts.google.com', 'do-not-reply@bank.com', 'donotreply@x.io',
      'notifications@slack.com', 'notifications+abc@x.com', 'newsletter@company.com', 'news@company.com', 'updates@saas.io',
      'mailer-daemon@googlemail.com', 'marketing@brand.com', 'hello@em.clickup.com', 'team@click.email.slackhq.com', 'x@mail.notion.so']) {
      assert.equal(email(a), true, a);
    }
  });

  it('never flags real people or ordinary business mailboxes (their badge matters)', () => {
    for (const a of ['himanshu@gmail.com', 'ravi.kumar@acme.com', 'sales@customer.com', 'support@customer.com', 'hello@customer.com',
      'team@customer.com', 'info@shop.in', 'news.reporter@gmail.com', 'updatesmith@gmail.com', 'ali@company.com']) {
      assert.equal(email(a), false, a);
    }
  });

  it('only applies to the email channel and tolerates junk input', () => {
    assert.equal(isAutomatedSender({ channel: 'whatsapp', email: 'noreply@x.com' }), false);
    assert.equal(isAutomatedSender({ channel: 'instagram' }), false);
    for (const v of [undefined, null, '', 'not-an-email', '@x.com']) assert.equal(email(v), false, String(v));
    assert.equal(isAutomatedSender(), false);
  });
});

describe('inbox UI wiring', () => {
  it('the waiting-for-reply badge is skipped for automated senders', () => {
    assert.match(item, /import \{ isAutomatedSender \} from '@\/lib\/omnichannel\/automatedSender'/);
    assert.match(item, /if \(!automated && chat\.lastMessageDirection === 'incoming'/);
  });

  it('the header call button only exists when the contact has a phone number', () => {
    assert.match(header, /\{lead\.phone && \(\s*<button type="button" onClick=\{onCall\}/);
  });

  it('email threads stay on the flat colour; chat threads get the wallpaper (all three states)', () => {
    assert.match(list, /conversation\?\.channel === 'email' \? 'bg-\[#F1F6F3\] dark:bg-\[#0b141a\]' : 'chat-wallpaper'/);
    assert.equal((list.match(/\$\{surface\}/g) || []).length, 3);
  });

  it('room is reserved for the floating buttons on the message list and the composer', () => {
    assert.match(page, /gutterClass=\{listGutter\}/);
    assert.match(page, /fabGutter=\{composerGutter\}/);
    assert.match(page, /const listGutter = profileCollapsed \? 'pr-\[76px\]' : 'pr-\[76px\] xl:pr-4'/);
    assert.match(page, /const composerGutter = profileCollapsed \? 'pr-\[76px\]' : 'pr-\[76px\] xl:pr-0'/);
    assert.match(list, /gutterClass = 'pr-4'/);
    assert.match(list, /pl-4 py-4 \$\{gutterClass\}/);
    assert.match(input, /fabGutter = ''/);
    assert.match(input, /border-t transition-colors \$\{fabGutter\}/);
  });
});

describe('wallpaper icons are industry-neutral', () => {
  it('no car or wrench (the tile is shown to every business, not only garages)', () => {
    const tiles = [...css.matchAll(/\.(?:dark )?chat-wallpaper \{[^}]*?url\("data:image\/svg\+xml,([^"]+)"\)/g)].map((m) => decodeURIComponent(m[1]));
    assert.equal(tiles.length, 2);
    for (const svg of tiles) {
      assert.doesNotMatch(svg, /M19 17h2c\.6 0 1-\.4 1-1v-3/, 'car icon is back');
      assert.doesNotMatch(svg, /M14\.7 6\.3a1 1 0 0 0 0 1\.4/, 'wrench icon is back');
    }
  });
});
