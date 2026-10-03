'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/lib/apiClient';
import { REALTIME_EVENTS } from '@/lib/realtime/constants';

/**
 * Tenant-scoped realtime events via short polling (/api/realtime/poll).
 *
 * Replaces the old held-open SSE (EventSource) connection, which kept a
 * serverless function open ~300s per tab and burned Fluid CPU/memory on
 * Vercel. The return shape is unchanged, so consumers don't need to change.
 *
 * One poller per browser tab, shared by every component that uses this hook
 * (the notification bell, global notifications and a page's list used to run
 * three separate 5-second timers). It polls every 5 s while the user is
 * active, every 20 s after 2 minutes without input, not at all while the tab
 * is hidden, and immediately when they come back. The token goes in the
 * Authorization header, not the URL, so it stays out of access logs.
 */
const ACTIVE_INTERVAL = 5000;
const IDLE_INTERVAL = 20000;
const IDLE_AFTER = 2 * 60 * 1000;

const subscribers = new Set(); // { onEvent(ref), setConnected, setLastEvent }
const shared = { timer: null, since: 0, inFlight: false, connected: false, lastInput: 0, wired: false };

function broadcastConnected(value) {
  shared.connected = value;
  for (const s of subscribers) s.setConnected(value);
}

async function pollOnce() {
  const token = getAuthToken();
  if (!token || shared.inFlight || !subscribers.size) return;
  shared.inFlight = true;
  try {
    const res = await fetch(`/api/realtime/poll?since=${shared.since}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      broadcastConnected(false);
      return;
    }
    const data = await res.json();
    broadcastConnected(true);
    if (typeof data.now === 'number') shared.since = data.now;
    for (const event of data.events || []) {
      for (const s of subscribers) {
        s.setLastEvent(event);
        s.onEvent.current?.(event);
      }
    }
  } catch {
    broadcastConnected(false);
  } finally {
    shared.inFlight = false;
  }
}

function stopLoop() {
  if (shared.timer) clearTimeout(shared.timer);
  shared.timer = null;
}

function scheduleNext() {
  stopLoop();
  if (!subscribers.size || document.visibilityState !== 'visible') return;
  const idle = Date.now() - shared.lastInput > IDLE_AFTER;
  shared.timer = setTimeout(async () => {
    await pollOnce();
    scheduleNext();
  }, idle ? IDLE_INTERVAL : ACTIVE_INTERVAL);
}

function restartNow() {
  stopLoop();
  pollOnce().finally(scheduleNext);
}

function onVisibility() {
  if (document.visibilityState === 'visible') restartNow();
  else stopLoop();
}

function onInput() {
  const wasIdle = Date.now() - shared.lastInput > IDLE_AFTER;
  shared.lastInput = Date.now();
  if (wasIdle && subscribers.size) restartNow(); // back from idle: catch up now
}

function wireGlobalListeners() {
  if (shared.wired) return;
  shared.wired = true;
  document.addEventListener('visibilitychange', onVisibility);
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(type, onInput, { passive: true });
  }
}

function unwireGlobalListeners() {
  if (!shared.wired) return;
  shared.wired = false;
  document.removeEventListener('visibilitychange', onVisibility);
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.removeEventListener(type, onInput);
  }
}

// `interval` is accepted for backward compatibility; the shared poller sets the pace.
// eslint-disable-next-line no-unused-vars
export function useRealtime({ onEvent, enabled = true, interval } = {}) {
  const [connected, setConnected] = useState(shared.connected);
  const [lastEvent, setLastEvent] = useState(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return undefined;
    }
    const sub = { onEvent: onEventRef, setConnected, setLastEvent };
    const first = subscribers.size === 0;
    subscribers.add(sub);
    if (first) {
      // Don't replay history — start from "now".
      shared.since = Date.now();
      shared.lastInput = Date.now();
      wireGlobalListeners();
      restartNow();
    }
    return () => {
      subscribers.delete(sub);
      if (subscribers.size === 0) {
        stopLoop();
        unwireGlobalListeners();
      }
    };
  }, [enabled]);

  const reconnect = useCallback(() => restartNow(), []);
  const disconnect = useCallback(() => setConnected(false), []);

  return { connected, lastEvent, reconnect, disconnect };
}

export { REALTIME_EVENTS };
