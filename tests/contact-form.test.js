/**
 * The Contact page form really sends the message (it used to show "Message sent!" after a timer and send nothing).
 * Run: node --test tests/contact-form.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const { buildContactPayload, submitContactForm, TOPIC_LABELS } = await import('../lib/contactForm.js');
const { CONTACT_FORM_TOKEN } = await import('../lib/publicForms.js');

const form = { name: '  Riya Sharma ', email: ' riya@example.com ', company: ' Acme ', topic: 'partners', message: ' Hello there ' };
const consent = { visitorId: 'v1', cookieConsent: 'granted', analyticsAllowed: true, marketingAllowed: false };

/** A fake fetch that records the request and answers with the given JSON. */
const fakeFetch = (status, json, calls = []) => async (url, init) => {
  calls.push({ url, init });
  return { ok: status >= 200 && status < 300, status, json: async () => json };
};

describe('payload', () => {
  it('uses the same public form token as the homepage form and trims the fields', () => {
    const p = buildContactPayload(form, consent);
    assert.equal(p.token, CONTACT_FORM_TOKEN);
    assert.equal(p.name, 'Riya Sharma');
    assert.equal(p.email, 'riya@example.com');
    assert.equal(p.message, 'Hello there');
    assert.equal(p.company, 'Acme');
  });

  it('turns the chosen topic into the lead\'s Service interest', () => {
    assert.equal(buildContactPayload(form).serviceInterest, 'Partnerships');
    for (const [key, label] of Object.entries(TOPIC_LABELS)) assert.equal(buildContactPayload({ ...form, topic: key }).serviceInterest, label);
    assert.equal(buildContactPayload({ ...form, topic: 'unknown' }).serviceInterest, 'General Inquiry');
  });

  it('carries the visitor\'s cookie-consent choice, and leaves an empty company out', () => {
    const p = buildContactPayload({ ...form, company: '   ' }, consent);
    assert.equal(p.visitorId, 'v1');
    assert.equal(p.cookieConsent, 'granted');
    assert.equal(p.marketingAllowed, false);
    assert.ok(!('company' in p));
  });
});

describe('submitContactForm', () => {
  it('POSTs JSON to the form endpoint and reports success with the server\'s message', async () => {
    const calls = [];
    const r = await submitContactForm(form, { consent, url: 'https://x.test/api/forms/submit', fetchImpl: fakeFetch(200, { success: true, message: 'Thank you!' }, calls) });
    assert.deepEqual(r, { ok: true, message: 'Thank you!' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://x.test/api/forms/submit');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
    assert.equal(JSON.parse(calls[0].init.body).email, 'riya@example.com');
  });

  it('falls back to a default thank-you when the server sends no message', async () => {
    const r = await submitContactForm(form, { fetchImpl: fakeFetch(200, { success: true }) });
    assert.equal(r.ok, true);
    assert.ok(r.message.length > 10);
  });

  it('reports the server\'s reason on a rejected submission (invalid form, rate limit, lead limit)', async () => {
    const limited = await submitContactForm(form, { fetchImpl: fakeFetch(429, { error: 'Too many requests. Please try again in about 30 seconds.' }) });
    assert.deepEqual(limited, { ok: false, error: 'Too many requests. Please try again in about 30 seconds.' });
    const bad = await submitContactForm(form, { fetchImpl: fakeFetch(404, { success: false, error: 'Invalid or inactive form' }) });
    assert.equal(bad.ok, false);
    assert.equal(bad.error, 'Invalid or inactive form');
  });

  it('never claims success when the server did not confirm it', async () => {
    assert.equal((await submitContactForm(form, { fetchImpl: fakeFetch(200, { success: false }) })).ok, false);
    assert.equal((await submitContactForm(form, { fetchImpl: fakeFetch(500, {}) })).ok, false);
    const notJson = async () => ({ ok: true, status: 200, json: async () => { throw new Error('not json'); } });
    assert.equal((await submitContactForm(form, { fetchImpl: notJson })).ok, false);
  });

  it('turns a network failure into a message instead of throwing', async () => {
    const r = await submitContactForm(form, { fetchImpl: async () => { throw new Error('offline'); } });
    assert.equal(r.ok, false);
    assert.match(r.error, /Network error/);
  });
});

describe('Contact page wiring', () => {
  const src = read('app/contact/page.js');

  it('no longer fakes the result with a timer', () => {
    assert.ok(!src.includes('setTimeout'));
    assert.ok(!src.includes("Message sent! We"));
  });

  it('sends through the helper with the consent payload, blocks double submits, and only clears the form on success', () => {
    assert.ok(src.includes('submitContactForm(form, { consent: getConsentPayloadForForms() })'));
    assert.ok(src.includes('if (sending) return;'));
    const ok = src.indexOf('if (result.ok) {');
    const clear = src.indexOf("setForm({ name: '', email: '', company: '', topic: 'sales', message: '' });", ok);
    const fail = src.indexOf('toast.error(result.error)', ok);
    assert.ok(ok > 0 && clear > ok && fail > clear, 'the form is cleared inside the success branch; failures show the error and keep the text');
  });
});
