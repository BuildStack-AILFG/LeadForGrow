'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Code sample switcher for the API reference (cURL / JavaScript / response). */
export default function CodeTabs({ samples }) {
  const [active, setActive] = useState(samples[0].label);
  const [copied, setCopied] = useState(false);
  const current = samples.find((s) => s.label === active) || samples[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is still selectable */
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A120E]">
      <div className="flex items-center justify-between border-b border-white/10 px-2">
        <div role="tablist" className="flex">
          {samples.map((s) => (
            <button
              key={s.label}
              role="tab"
              aria-selected={active === s.label}
              onClick={() => setActive(s.label)}
              className={`px-3 py-2.5 text-xs font-medium transition-colors ${active === s.label ? 'border-b-2 border-[#34D399] text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={copy} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white" aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5 text-[#34D399]" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-[#C9F2DE]"><code>{current.code}</code></pre>
    </div>
  );
}
