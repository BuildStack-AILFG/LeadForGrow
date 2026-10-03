'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * Code-split a panel (drawer, modal, wizard) out of the page bundle. The page loads without
 * it; the browser fetches it in the background once the page is idle, so the first open is
 * still instant. Use with `useOpenedOnce` to mount it only after it has been opened.
 */
export function lazyPanel(loader) {
  const Component = dynamic(loader, { ssr: false });
  if (typeof window !== 'undefined') {
    const warm = () => loader().catch(() => {});
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 2000);
  }
  return Component;
}

/** True from the first time `open` is truthy — keeps a panel mounted so its close animation plays. */
export function useOpenedOnce(open) {
  const [opened, setOpened] = useState(!!open);
  useEffect(() => {
    if (open) setOpened(true);
  }, [open]);
  return opened || !!open;
}
