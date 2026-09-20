/**
 * Logout must clear the signed-in user's data but keep device-level keys (cookie choice, visitor id, theme,
 * marketing-popup snooze) — otherwise the cookie banner and Contact Us popup return after every logout.
 * Run: node --test tests/client-storage.test.js
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearUserStorage, isDeviceLevelKey } from '../lib/clientStorage.js';

function fakeLocalStorage(initial = {}) {
  const data = { ...initial };
  return {
    get length() { return Object.keys(data).length; },
    key: (i) => Object.keys(data)[i] ?? null,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _keys: () => Object.keys(data).sort(),
  };
}

describe('clearUserStorage', () => {
  beforeEach(() => { globalThis.window = {}; });

  it('keeps cookie consent, visitor id, theme and popup snooze', () => {
    globalThis.localStorage = fakeLocalStorage({
      lfg_cookie_consent: '{"status":"denied"}',
      lfg_visitor_id: 'vis_1',
      lfg_pending_page_views: '[]',
      theme: 'dark',
      lfg_enquiry_popup_dismissed_until: '9999999999999',
      lfg_enquiry_form_submitted_until: '9999999999999',
      lfg_ui_inbox_profile_collapsed: '1',
      token: 't', userToken: 'u', refreshToken: 'r', userid: '1', userEmail: 'a@b.c',
      businessId: 'b', userPlan: 'growth', userRole: 'owner', accountFrozen: 'false',
    });
    clearUserStorage();
    assert.deepEqual(localStorage._keys(), [
      'lfg_cookie_consent', 'lfg_enquiry_form_submitted_until', 'lfg_enquiry_popup_dismissed_until',
      'lfg_pending_page_views', 'lfg_ui_inbox_profile_collapsed', 'lfg_visitor_id', 'theme',
    ]);
  });

  it('still removes every auth/user key (logout really signs the user out)', () => {
    globalThis.localStorage = fakeLocalStorage({
      token: 't', userToken: 'u', refreshToken: 'r', userid: '1', userEmail: 'a@b.c',
      businessId: 'b', userPlan: 'growth', userRole: 'owner', hasAgency: 'true', businessPlan: 'growth',
      lfg_access: '{}', sidebarCollapsed: '1',
    });
    clearUserStorage();
    assert.deepEqual(localStorage._keys(), []);
  });

  it('does nothing harmful on an empty store', () => {
    globalThis.localStorage = fakeLocalStorage();
    assert.doesNotThrow(() => clearUserStorage());
  });

  it('never throws when storage is blocked', () => {
    globalThis.localStorage = { get length() { throw new Error('denied'); }, key() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
    assert.doesNotThrow(() => clearUserStorage());
  });

  it('is a no-op outside the browser', () => {
    delete globalThis.window;
    globalThis.localStorage = fakeLocalStorage({ token: 't' });
    clearUserStorage();
    assert.deepEqual(localStorage._keys(), ['token']);
  });
});

describe('isDeviceLevelKey', () => {
  it('matches the exact keys the banner and popup actually use', () => {
    for (const k of ['lfg_cookie_consent', 'lfg_visitor_id', 'theme', 'lfg_pending_page_views',
      'lfg_enquiry_popup_dismissed_until', 'lfg_enquiry_form_submitted_until', 'lfg_ui_inbox_profile_collapsed']) {
      assert.equal(isDeviceLevelKey(k), true, k);
    }
    for (const k of ['token', 'userToken', 'userid', 'lfg_access', 'lfg_intro_seen_v1']) {
      assert.equal(isDeviceLevelKey(k), false, k);
    }
  });
});
