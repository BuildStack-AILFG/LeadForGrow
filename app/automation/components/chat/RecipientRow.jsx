'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gmail/Hostinger-style recipient field, reused for both Cc and Bcc. Source of
// truth stays a comma-separated string (parent contract is unchanged), but
// recipients render as removable bordered pills with per-address validation.
// Typing an address and pressing Enter/comma/Tab — or pasting a list, or
// blurring — commits it to a chip; Backspace on an empty input removes the last.
export default function RecipientRow({ label, value, onChange, autoFocus, className = '' }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const chips = (value || '').split(',').map((s) => s.trim()).filter(Boolean);

  const setChips = (arr) => onChange?.(arr.join(', '));

  const commit = (raw) => {
    const parts = raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...chips];
    parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
    setChips(next);
    setDraft('');
  };

  const removeAt = (i) => setChips(chips.filter((_, idx) => idx !== i));

  const onKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && chips.length) {
      removeAt(chips.length - 1);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex flex-wrap items-center gap-1.5 w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-text focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 ${className}`}
    >
      <span className="pr-0.5 text-[11px] font-semibold text-slate-400 select-none w-7 shrink-0">{label}</span>
      {chips.map((c, i) => {
        const valid = EMAIL_RE.test(c);
        return (
          <span
            key={`${c}-${i}`}
            title={valid ? c : 'Invalid email address'}
            className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[11px] max-w-full ${
              valid
                ? 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span className="truncate">{c}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeAt(i); }}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-500 dark:hover:text-slate-100"
              aria-label={`Remove ${c}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        value={draft}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (draft.trim()) commit(draft); }}
        onPaste={(e) => {
          const t = e.clipboardData.getData('text');
          if (/[,\s]/.test(t)) { e.preventDefault(); commit(`${draft} ${t}`); }
        }}
        placeholder={chips.length ? '' : 'name@example.com'}
        className="flex-1 min-w-[120px] bg-transparent outline-none py-0.5 text-xs placeholder:text-slate-400"
      />
    </div>
  );
}
