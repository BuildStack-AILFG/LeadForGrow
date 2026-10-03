'use client';

/**
 * Authenticated fetch client — JWT-only, no userId query params.
 */

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userToken') || localStorage.getItem('token') || null;
}

export function getUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userid') || null;
}

export function setAuthSession({ token, userId }) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('userToken', token);
    localStorage.setItem('token', token);
  }
  if (userId) localStorage.setItem('userid', userId);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  sharedGets.clear();
  localStorage.removeItem('userToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userid');
}

export function authHeaders(extra = {}) {
  const token = getAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// GET endpoints that several components request at the same moment on page load
// (the access gate, the sidebar and the page itself all ask "who am I").
// Concurrent and back-to-back calls within a few seconds share one request.
const SHARED_GET_URLS = new Set(['/api/auth/me']);
const SHARED_GET_TTL_MS = 5000;
const sharedGets = new Map();

/**
 * Fetch with JWT auth. Never sends userId query params.
 */
export async function authFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET' && SHARED_GET_URLS.has(url) && !options.signal) {
    const key = `${url}|${getAuthToken() || ''}`;
    const hit = sharedGets.get(key);
    if (hit && Date.now() - hit.at < SHARED_GET_TTL_MS) return (await hit.promise).clone();
    const promise = sendAuthFetch(url, options).then((res) => {
      if (!res.ok) sharedGets.delete(key);
      return res;
    });
    sharedGets.set(key, { at: Date.now(), promise });
    promise.catch(() => sharedGets.delete(key));
    return (await promise).clone();
  }
  // Any write may change what those endpoints return, so drop the shared copies.
  if (method !== 'GET') sharedGets.clear();
  return sendAuthFetch(url, options);
}

async function sendAuthFetch(url, options) {
  const headers = new Headers(options.headers || {});

  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (!path.startsWith('/user/')) {
      clearAuthSession();
      window.location.href = `/user/register?mode=login&redirect=${encodeURIComponent(path)}&expired=1`;
    }
  }

  return res;
}

export async function authJson(url, options = {}) {
  const res = await authFetch(url, options);
  return res.json();
}
