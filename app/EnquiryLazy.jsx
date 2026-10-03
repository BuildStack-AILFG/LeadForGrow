'use client';

import { lazyPanel } from '@/app/components/lazyPanel';

// The marketing contact widget (and its icons) loads once the page is idle instead of
// with every public page's first paint.
const LeadForGrowWidget = lazyPanel(() => import('./Enquiry'));

export default function EnquiryLazy(props) {
  return <LeadForGrowWidget {...props} />;
}
