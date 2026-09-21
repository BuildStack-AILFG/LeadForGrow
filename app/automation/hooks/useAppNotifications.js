'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtime, REALTIME_EVENTS } from './useRealtime';
import { playMessageChime, playLeadChime, playPaidChime } from '@/lib/notifications/soundPlayer';
import { CHANNEL_META } from '@/lib/omnichannel/constants';

/**
 * useAppNotifications — global notification behaviour for the workspace.
 * Mounted once at the top of the automation layout so it fires on every
 * page (Dashboard, Deals, Bills, etc.) not just when the user is in Inbox.
 *
 * What it does when a real-time event lands:
 *   - Plays a distinct sound (message chime vs lead chime)
 *   - Flashes the tab title if the tab is hidden ("(1 new) LeadForGrow")
 *   - Shows a native browser Notification if the tab is hidden AND
 *     permission is granted; clicking it focuses the tab + navigates to
 *     the relevant page (Inbox for messages, Leads for new leads)
 *
 * User controls:
 *   - localStorage key `lfg.notifications.enabled` — set to "false" to
 *     silence sounds. Default: on.
 *   - Native browser permission dialog on first mount — declined = no
 *     browser notifications, but sound + title flash still work.
 */

const STORAGE_KEY = 'lfg.notifications.enabled';

export function useAppNotifications() {
  const [enabled, setEnabled] = useState(true);
  const titleFlashRef = useRef({ original: null, interval: null, count: 0 });

  // Read stored preference on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') setEnabled(false);
    // Ask for browser Notification permission on first mount — quiet no-op if
    // already granted / denied. User's browser remembers their choice.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const setEnabledPersistent = useCallback((val) => {
    setEnabled(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
    }
  }, []);

  // Title flash — stops on any tab focus
  const startTitleFlash = useCallback((message) => {
    if (typeof document === 'undefined') return;
    if (!document.hidden) return; // no need if tab is already visible
    const state = titleFlashRef.current;
    if (state.original == null) state.original = document.title;
    state.count += 1;
    const flashMessage = `(${state.count}) ${message}`;
    if (state.interval) clearInterval(state.interval);
    let toggle = true;
    document.title = flashMessage;
    state.interval = setInterval(() => {
      document.title = toggle ? state.original : flashMessage;
      toggle = !toggle;
    }, 1200);
  }, []);

  const stopTitleFlash = useCallback(() => {
    const state = titleFlashRef.current;
    if (state.interval) clearInterval(state.interval);
    if (state.original != null) document.title = state.original;
    state.interval = null;
    state.original = null;
    state.count = 0;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => { if (!document.hidden) stopTitleFlash(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [stopTitleFlash]);

  // Trigger browser Notification if allowed + tab is hidden
  const maybeShowBrowserNotification = useCallback(({ title, body, url }) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!document.hidden) return; // If tab is visible, sound + title flash are enough

    try {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        // tag lets rapid successive notifications collapse into one instead of
        // stacking — no one wants 12 popups in a row for a burst of messages
        tag: url || 'lfg-notification',
        renotify: true,
      });
      n.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
        n.close();
      };
      // Auto-close after 8s so notification tray doesn't stack up
      setTimeout(() => { try { n.close(); } catch {} }, 8000);
    } catch { /* silent — user's browser may block */ }
  }, []);

  useRealtime({
    onEvent: useCallback((event) => {
      if (!enabled) return;

      // CHAT_MESSAGE fires when any incoming/outgoing message is recorded —
      // we only chime for incoming ones (outgoing = user just sent, no
      // need to interrupt them with a notification about their own action).
      if (event.type === REALTIME_EVENTS.CHAT_MESSAGE) {
        if (event.data?.direction === 'outgoing') return;
        playMessageChime();
        startTitleFlash('New message · LeadForGrow');
        // Channel and sender come with the event (it used to say "WhatsApp" for every channel and never who wrote).
        const channelLabel = CHANNEL_META[event.data?.channel]?.label || 'WhatsApp';
        const from = event.data?.senderName;
        maybeShowBrowserNotification({
          title: from ? `${channelLabel} · ${from}` : `New ${channelLabel} message`,
          body: event.data?.preview || 'A customer just messaged you.',
          url: '/automation/chat',
        });
      }

      // LEAD_UPDATED fires on new lead creation AND lead edits — we only
      // want to alert on creation (action === 'created'). Everything else
      // is silent (would be noisy otherwise).
      else if (event.type === REALTIME_EVENTS.LEAD_UPDATED) {
        if (event.data?.action !== 'created') return;
        playLeadChime();
        startTitleFlash('New lead · LeadForGrow');
        maybeShowBrowserNotification({
          title: 'New lead just landed',
          body: event.data?.source ? `Source: ${event.data.source}` : 'A new lead was added.',
          url: '/automation/leads',
        });
      }

      // BILL_PAID — the money-hit-the-bank moment. Celebratory chime +
      // shows exact amount and payer. Fires from the Razorpay webhook after
      // the payment link is marked paid.
      else if (event.type === REALTIME_EVENTS.BILL_PAID) {
        playPaidChime();
        const amount = Number(event.data?.amount || 0).toLocaleString('en-IN');
        const from = event.data?.customerName ? ` from ${event.data.customerName}` : '';
        startTitleFlash(`₹${amount} received · LeadForGrow`);
        maybeShowBrowserNotification({
          title: `💰 Payment received: ₹${amount}`,
          body: `Bill ${event.data?.billNumber || ''}${from} — paid.`,
          url: event.data?.billId
            ? `/automation/bills?view=detail&id=${event.data.billId}`
            : '/automation/bills',
        });
      }
    }, [enabled, startTitleFlash, maybeShowBrowserNotification]),
  });

  return { enabled, setEnabled: setEnabledPersistent };
}
