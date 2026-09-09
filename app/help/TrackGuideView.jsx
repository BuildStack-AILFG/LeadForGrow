'use client';

import { useEffect } from 'react';
import { pushRecentGuide } from '@/app/automation/components/shared/tour/storage';

// Invisible — records this guide as "recently viewed" for the Help Center
// index. A tiny client island so the guide detail page itself can stay a
// server component.
export default function TrackGuideView({ slug }) {
  useEffect(() => {
    pushRecentGuide(slug);
  }, [slug]);
  return null;
}
