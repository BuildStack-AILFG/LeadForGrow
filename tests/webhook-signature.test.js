/**
 * Meta webhook signature enforcement.
 *
 * Guards against the gaps found in Phase 0:
 *  - Instagram, Facebook Page, template-status and delivery-status branches of the
 *    shared webhook processed events without verifying X-Hub-Signature-256.
 *  - The per-business webhook only rejected a *wrong* signature, so a request with
 *    no header (or a business with no secret) was processed as genuine.
 *  - Rejection responses echoed signature diagnostics, including the expected HMAC
 *    for the posted body, which let a forger resend the same body signed.
 *
 * Run: node --test tests/webhook-signature.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyMetaSignature, verifyMetaSignatureCandidates } from '../lib/webhookSecurity.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sign = (body, secret) => `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

const generic = read('app/api/webhooks/meta/route.js');
const perBusiness = read('app/api/webhooks/meta/[businessId]/route.js');
const ingress = read('lib/meta/webhookIngress.js');

describe('signature primitives', () => {
  const body = JSON.stringify({ object: 'instagram', entry: [{ id: '1784' }] });

  it('accepts a body signed with one of the candidate secrets', () => {
    const r = verifyMetaSignatureCandidates(body, sign(body, 'right'), [
      { source: 'a', secret: 'wrong' },
      { source: 'b', secret: 'right' },
    ]);
    assert.equal(r.valid, true);
    assert.equal(r.matchedSource, 'b');
  });

  it('rejects a signature made with an unknown secret', () => {
    const r = verifyMetaSignatureCandidates(body, sign(body, 'attacker'), [{ source: 'a', secret: 'right' }]);
    assert.equal(r.valid, false);
  });

  it('rejects a tampered body even with a once-valid signature', () => {
    const sig = sign(body, 'right');
    assert.equal(verifyMetaSignature(body.replace('1784', '9999'), sig, 'right'), false);
  });

  it('reports "not valid" (null) with no header or no secrets, which callers must treat as a rejection', () => {
    assert.equal(verifyMetaSignatureCandidates(body, null, [{ source: 'a', secret: 'right' }]).valid, null);
    assert.equal(verifyMetaSignatureCandidates(body, sign(body, 'right'), []).valid, null);
  });
});

describe('shared webhook verifies before processing every branch', () => {
  const guardedBefore = (guardStep, processCall) => {
    const guard = generic.indexOf(guardStep);
    const process = generic.indexOf(processCall);
    assert.ok(guard > -1, `missing guard ${guardStep}`);
    assert.ok(process > -1, `missing call ${processCall}`);
    assert.ok(guard < process, `${processCall} must run only after ${guardStep}`);
  };

  it('Instagram DMs and comments', () => {
    guardedBefore("'instagram_signature_invalid'", 'processInstagramEvent(business._id');
    guardedBefore("'instagram_signature_invalid'", 'processInstagramCommentEvent(business._id');
  });

  it('Facebook Messenger and Page comments', () => {
    guardedBefore("'facebook_signature_invalid'", 'processMessengerEvent(business._id');
    guardedBefore("'facebook_signature_invalid'", 'processFacebookCommentEvent(business._id');
  });

  it('WhatsApp template status (could otherwise flip templates to APPROVED)', () => {
    guardedBefore("'template_status_signature_invalid'", 'processTemplateStatusPayload(payload)');
  });

  it('WhatsApp delivery receipts (could otherwise falsify broadcast analytics)', () => {
    guardedBefore("'whatsapp_status_signature_invalid'", 'processWhatsAppStatuses(business._id');
  });

  it('the shared verifier fails closed (strict boolean)', () => {
    assert.match(ingress, /export async function verifyMetaSignatureForBusinesses/);
    assert.match(ingress, /valid: result\.valid === true/);
  });
});

describe('per-business webhook fails closed', () => {
  it('rejects anything that is not positively verified', () => {
    assert.match(perBusiness, /if \(signatureResult\.valid !== true\)/);
    assert.doesNotMatch(perBusiness, /if \(signature && signatureResult\.valid === false\)/);
  });
});

describe('no signature oracle', () => {
  it('rejection responses never include signature diagnostics', () => {
    for (const [name, src] of [['generic', generic], ['perBusiness', perBusiness]]) {
      assert.doesNotMatch(src, /step: 'signature',\s*signatureResult/, `${name} echoes signatureResult`);
      assert.doesNotMatch(src, /error: reason, step: 'signature', signatureResult/, `${name} echoes signatureResult`);
    }
  });
});

describe('secrets for Instagram and Facebook', () => {
  it('are candidates for verification', () => {
    assert.match(ingress, /business\.instagram', resolveMaybeEncrypted\(business\?\.integrationCredentials\?\.instagram\?\.appSecret\)/);
    assert.match(ingress, /business\.facebook', resolveMaybeEncrypted\(business\?\.integrationCredentials\?\.facebook\?\.appSecret\)/);
    assert.match(ingress, /env\.INSTAGRAM_APP_SECRET', process\.env\.INSTAGRAM_APP_SECRET/);
  });

  it('are stored encrypted and only reported as a boolean', () => {
    for (const p of ['app/api/business/settings/instagram-status/route.js', 'app/api/business/settings/facebook-status/route.js']) {
      const src = read(p);
      assert.match(src, /appSecret: appSecret\s*\?\s*encryptOnce\(appSecret\)/, `${p} must encrypt`);
      assert.match(src, /hasAppSecret: Boolean\(/, `${p} must expose only a boolean`);
      assert.doesNotMatch(src, /appSecret: (ig|fb)\.appSecret/, `${p} must not return the secret`);
    }
  });
});
