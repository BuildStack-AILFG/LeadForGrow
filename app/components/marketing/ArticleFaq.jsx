'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Simple accordion for a blog article's FAQ block — pairs with the
 * FAQPage JSON-LD built by lib/seo/jsonLd.js's buildFaqJsonLd(). */
export default function ArticleFaq({ faqs = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!faqs.length) return null;

  return (
    <div className="divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0] overflow-hidden">
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : i)}
              aria-expanded={open}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FAFDFA] transition-colors"
            >
              <span className="text-[15px] font-semibold text-[#111827]">{faq.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && (
              <div className="px-5 pb-4 text-[14px] leading-relaxed text-[#64748B]">{faq.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
