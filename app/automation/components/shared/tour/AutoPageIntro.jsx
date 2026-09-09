'use client';

import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import PageIntro from './PageIntro';
import { findIntroForPath } from './registry';

/**
 * Drop `<AutoPageIntro />` under any page header — it looks up the current
 * route in the tour registry and renders the matching one-shot welcome
 * card automatically. Renders nothing if the route has no registered
 * intro (or already has a full ProductTour instead).
 */
export default function AutoPageIntro() {
  const pathname = usePathname();
  const intro = findIntroForPath(pathname);
  if (!intro) return null;

  const Icon = Icons[intro.icon] || Icons.Sparkles;

  return (
    <PageIntro
      id={intro.id}
      icon={Icon}
      title={intro.title}
      body={intro.body}
      guideHref={intro.guideHref}
      tone={intro.tone}
    />
  );
}
