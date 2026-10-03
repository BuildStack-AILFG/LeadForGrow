/**
 * Email drafts + email previews. Run: node --test tests/email-drafts.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { htmlToPlainText, pickDraftFields, workingDraftFilter } from '../lib/omnichannel/draftFields.js';
import { cleanEmailPreview } from '../lib/omnichannel/preview.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('pickDraftFields', () => {
  it('keeps only known draft fields: a client can never set businessId / createdBy / _id / scheduledAt', () => {
    const out = pickDraftFields({
      businessId: 'OTHER_TENANT', createdBy: 'someone-else', _id: 'x', scheduledAt: '2030-01-01', sendAttempts: 99, sendError: 'x',
      conversationId: 'c1', leadId: 'l1', subject: 'Hi', bodyHtml: '<p>Hello</p>', cc: [{ email: 'a@b.co' }], bcc: [],
    });
    assert.deepEqual(Object.keys(out).sort(), ['bcc', 'bodyHtml', 'bodyText', 'cc', 'conversationId', 'leadId', 'subject']);
    assert.equal(out.businessId, undefined);
    assert.equal(out.createdBy, undefined);
  });

  it('derives bodyText from bodyHtml (the Drafts tab showed "Empty draft" and Continue editing inserted nothing)', () => {
    assert.equal(pickDraftFields({ bodyHtml: '<div>Hello<br>World</div>' }).bodyText, 'Hello\nWorld');
  });

  it('respects an explicit bodyText and does not invent fields that were not sent', () => {
    assert.equal(pickDraftFields({ bodyHtml: '<p>x</p>', bodyText: 'custom' }).bodyText, 'custom');
    assert.deepEqual(pickDraftFields({ subject: 'only subject' }), { subject: 'only subject' });
    assert.deepEqual(pickDraftFields(undefined), {});
  });
});

describe('htmlToPlainText', () => {
  it('turns block tags into line breaks, strips tags and decodes the common entities', () => {
    assert.equal(htmlToPlainText('<p>Hi&nbsp;there</p><p>A &amp; B &lt;ok&gt;</p>'), 'Hi there\nA & B <ok>');
    assert.equal(htmlToPlainText('<div>one</div><div>two</div>'), 'one\ntwo');
    assert.equal(htmlToPlainText(''), '');
    assert.equal(htmlToPlainText(null), '');
  });
});

describe('workingDraftFilter', () => {
  it('is one unscheduled draft per business + conversation + user (scheduled drafts are never touched)', () => {
    const f = workingDraftFilter({ businessId: 'b', conversationId: 'c', userId: 'u' });
    assert.equal(f.businessId, 'b');
    assert.equal(f.conversationId, 'c');
    assert.equal(f.createdBy, 'u');
    assert.deepEqual(f.$or, [{ scheduledAt: { $exists: false } }, { scheduledAt: null }]);
  });
});

describe('route wiring', () => {
  const folders = read('app/api/automation/inbox/email/folders/route.js');
  const send = read('app/api/automation/inbox/send/route.js');
  const page = read('app/automation/chat/page.js');

  it('POST updates the thread draft instead of inserting a new one, and never spreads the raw body', () => {
    assert.match(folders, /findOneAndUpdate\(\s*workingDraftFilter\(/);
    assert.match(folders, /upsert: true/);
    assert.doesNotMatch(folders, /\.\.\.body\b/);
  });

  it('PUT only writes whitelisted fields', () => {
    assert.match(folders, /\$set: pickDraftFields\(body\)/);
    assert.doesNotMatch(folders, /\{ \$set: updates \}/);
  });

  it('sending an email reply deletes the thread working draft', () => {
    assert.match(send, /activeChannel === 'email' && conversation\?\._id/);
    assert.match(send, /EmailDraft\.deleteMany\(workingDraftFilter\(/);
  });

  it('Continue editing restores body, subject and Cc/Bcc', () => {
    assert.match(page, /draft\.bodyText \|\| htmlToPlainText\(draft\.bodyHtml\)/);
    assert.match(page, /inbox\.setEmailSubject\(draft\.subject\)/);
    assert.match(page, /inbox\.setEmailCc\(/);
  });
});

describe('cleanEmailPreview', () => {
  it('a preview that is only a tracking URL becomes "Link" (the exact row from the mailbox)', () => {
    assert.equal(cleanEmailPreview('[https://d15k2d11r6t6rl.cloudfront.net/public/user…]'), 'Link');
    assert.equal(cleanEmailPreview('[https://d15k2d11r6t6rl.cloudfront.net/public/user…'), 'Link');
  });

  it('keeps the readable words and drops bracketed / bare URLs', () => {
    assert.equal(cleanEmailPreview('Slack https://click.email.slackhq.com/?qs=AB7InY…'), 'Slack');
    assert.equal(cleanEmailPreview('Hello [https://x.com/a] world https://y.com bye'), 'Hello world bye');
    assert.equal(cleanEmailPreview('See <https://a.com/x> for details'), 'See for details');
  });

  it('leaves normal text alone and handles empty input', () => {
    assert.equal(cleanEmailPreview('Hi Saurabh, I came across ScaleDesk Technology and'), 'Hi Saurabh, I came across ScaleDesk Technology and');
    assert.equal(cleanEmailPreview('Re: Retest'), 'Re: Retest');
    assert.equal(cleanEmailPreview(''), '');
    assert.equal(cleanEmailPreview(undefined), '');
  });

  it('is applied to email rows only', () => {
    const item = read('app/automation/components/chat/ConversationItem.jsx');
    assert.match(item, /chat\.channel === 'email' \? cleanEmailPreview\(previewRaw\) : previewRaw/);
  });
});
