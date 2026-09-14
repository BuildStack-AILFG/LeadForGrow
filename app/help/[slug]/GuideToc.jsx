'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Right-rail "On this page" navigator — the Stripe/Mintlify-docs pattern the
 * user asked for. Scroll-spies the section headings with an
 * IntersectionObserver (no scroll-event polling) and smooth-scrolls on click.
 * Renders null on its own below `lg` — the page hides the wrapping <aside>
 * with `hidden lg:block` so this component doesn't need to know about that.
 */
export default function GuideToc({ items }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const visibleRef = useRef(new Map());

  useEffect(() => {
    const headingEls = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!headingEls.length) return undefined;

    const visible = visibleRef.current;
    visible.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        });
        if (visible.size > 0) {
          const topmost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
          setActiveId(topmost);
        }
      },
      { rootMargin: '-88px 0px -75% 0px', threshold: 0 }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-slate-200">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                aria-current={active ? 'true' : undefined}
                className={[
                  'block -ml-px border-l-2 py-1.5 leading-snug transition-colors',
                  item.indent ? 'pl-7 text-[12.5px]' : 'pl-3.5',
                  active
                    ? 'border-teal-600 text-teal-600 font-medium'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
                ].join(' ')}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
