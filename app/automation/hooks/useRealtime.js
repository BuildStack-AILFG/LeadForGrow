'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/lib/apiClient';
import { REALTIME_EVENTS } from '@/lib/realtime/constants';

/**
 * Tenant-scoped realtime events via short polling (/api/realtime/poll).
 *
 * Replaces the old held-open SSE (EventSource) connection, which kept a
 * serverless function open ~300s per tab and burned Fluid CPU/memory on
 * Vercel. Polling is a short request every few seconds — cheap on serverless,
 * and it pauses while the tab is hidden. The return shape is unchanged, so
 * consumers don't need to change.
 */
const DEFAULT_INTERVAL = 5000;

export function useRealtime({ onEvent, enabled = true, interval = DEFAULT_INTERVAL } = {}) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const sinceRef = useRef(Date.now());
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const poll = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !enabled) return;
    if (inFlightRef.current) return; // never overlap requests
    inFlightRef.current = true;
    try {
      const res = await fetch(
        `/api/realtime/poll?token=${encodeURIComponent(token)}&since=${sinceRef.current}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        setConnected(false);
        return;
      }
      const data = await res.json();
      setConnected(true);
      if (typeof data.now === 'number') sinceRef.current = data.now;
      for (const event of data.events || []) {
        setLastEvent(event);
        onEventRef.current?.(event);
      }
    } catch {
      setConnected(false);
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (!enabled) return;
    poll(); // immediate catch-up
    timerRef.current = setInterval(poll, interval);
  }, [enabled, interval, poll, stop]);

  useEffect(() => {
    if (!enabled) {
      stop();
      setConnected(false);
      return undefined;
    }

    // Don't replay history on (re)mount — start from "now".
    sinceRef.current = Date.now();
    start();

    // Pause polling while the tab is hidden; catch up immediately on return.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, start, stop]);

  const disconnect = useCallback(() => {
    stop();
    setConnected(false);
  }, [stop]);

  return { connected, lastEvent, reconnect: poll, disconnect };
}

export { REALTIME_EVENTS };
