/**
 * Cc/Bcc normalisation. The New Email window sent Cc as a string, and the
 * sender called cc.map() on it → "cc?.map is not a function".
 *
 * Run: node --test tests/email-recipients.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeRecipients } from '../lib/omnichannel/recipients.js';

describe('normalizeRecipients', () => {
  it('accepts a comma/semicolon-separated string (New Email window)', () => {
    assert.deepEqual(normalizeRecipients('a@x.com, b@y.co.in; c@z.io'), [{ email: 'a@x.com' }, { email: 'b@y.co.in' }, { email: 'c@z.io' }]);
    assert.deepEqual(normalizeRecipients('shashanksinghc8173@gmail.com'), [{ email: 'shashanksinghc8173@gmail.com' }]);
  });

  it('accepts [{ email }], [{ name, address }] and plain string arrays', () => {
    assert.deepEqual(normalizeRecipients([{ email: 'a@x.com' }]), [{ email: 'a@x.com' }]);
    assert.deepEqual(normalizeRecipients([{ name: 'Sam', address: 's@x.com' }]), [{ email: 's@x.com', name: 'Sam' }]);
    assert.deepEqual(normalizeRecipients(['a@x.com', 'Name <b@y.com>']), [{ email: 'a@x.com' }, { email: 'b@y.com' }]);
  });

  it('drops blanks, invalid addresses and duplicates', () => {
    assert.deepEqual(normalizeRecipients('a@x.com, , not-an-email, A@X.com'), [{ email: 'a@x.com' }]);
    assert.deepEqual(normalizeRecipients(undefined), []);
    assert.deepEqual(normalizeRecipients(''), []);
    assert.deepEqual(normalizeRecipients({}), []);
  });
});

describe('wiring', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  it('the send route and the sender both normalise Cc/Bcc', () => {
    const route = read('app/api/automation/inbox/send/route.js');
    assert.match(route, /const cc = normalizeRecipients\(rawCc\);/);
    assert.match(route, /const bcc = normalizeRecipients\(rawBcc\);/);
    const sender = read('lib/omnichannel/emailService.js');
    assert.match(sender, /cc: normalizeRecipients\(cc\)\.map\(\(c\) => c\.email\)/);
    assert.doesNotMatch(sender, /cc\?\.map/);
  });
});

describe('compose + signature', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  it('New Email uses the same Cc/Bcc chip input as the reply box', () => {
    const modal = read('app/automation/components/chat/ComposeEmailModal.jsx');
    assert.match(modal, /import RecipientRow from '\.\/RecipientRow';/);
    assert.match(modal, /<RecipientRow label="Cc" value=\{cc\} onChange=\{setCc\}/);
    assert.match(modal, /<RecipientRow label="Bcc" value=\{bcc\} onChange=\{setBcc\}/);
    assert.match(read('app/automation/components/chat/ChatInput.jsx'), /import RecipientRow from '\.\/RecipientRow';/);
  });

  it('the Default signature built from the old one keeps the old logo', () => {
    const editor = read('app/automation/components/settings/MultiSignatureEditor.jsx');
    assert.match(editor, /account\?\.signatureLogoUrl/);
    assert.match(editor, /html: `\$\{logo\}\$\{text\}`/);
  });

  it('the thread records the email as sent, including the signature', () => {
    assert.match(read('lib/omnichannel/emailService.js'), /sentHtml: signatureHtml \? html : undefined/);
    assert.match(read('app/api/automation/inbox/send/route.js'), /html: activeChannel === 'email' \? \(sentEmailHtml \|\| bodyHtml \|\| undefined\) : undefined/);
  });
});
