'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search } from 'lucide-react';
import cx from '@/app/components/ui/cx';

/**
 * Command palette (⌘K / Ctrl K) — jump to any page in the nav.
 * Navigation only for now; record search can plug in later via `extraItems`.
 */
export default function CommandPalette({ open, onClose, items }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = items.filter((i) => !i.locked);
    if (!q) return pool;
    return pool.filter((i) => i.name.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q));
  }, [items, query]);

  // Reset when closed (not on open) so keystrokes typed right after ⌘K aren't wiped.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setIndex(0);
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open || typeof document === 'undefined') return null;

  const go = (item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-[rgba(16,24,20,0.24)]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Go to page" className="relative w-full max-w-[560px] overflow-hidden rounded-lg bg-canvas shadow-modal">
        <div className="flex h-12 items-center gap-2 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-tertiary" strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to page…"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
            className="h-full flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary"
          />
          <kbd className="rounded-sm border border-line px-1.5 text-meta text-fg-tertiary">Esc</kbd>
        </div>
        <ul ref={listRef} id="command-palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-1">
          {results.length === 0 && <li className="px-3 py-6 text-center text-dense text-fg-secondary">No pages match “{query}”.</li>}
          {results.map((item, i) => {
            const Icon = item.icon;
            const selected = i === index;
            return (
              <li
                key={item.id}
                id={`cmd-${item.id}`}
                role="option"
                aria-selected={selected}
                onMouseMove={() => setIndex(i)}
                onClick={() => go(item)}
                className={cx('flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 text-body', selected ? 'bg-muted text-fg' : 'text-fg-secondary')}
              >
                <Icon className="h-4 w-4 shrink-0 text-fg-tertiary" strokeWidth={1.5} aria-hidden />
                <span className="flex-1 truncate">{item.name}</span>
                {item.group && <span className="text-meta text-fg-tertiary">{item.group}</span>}
                {selected && <CornerDownLeft className="h-3.5 w-3.5 text-fg-tertiary" strokeWidth={1.5} aria-hidden />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
