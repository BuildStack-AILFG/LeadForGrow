'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Loader2, RefreshCw, Check, Film, Image as ImageIcon, AlertCircle, LayoutGrid, CalendarClock, MousePointerClick } from 'lucide-react';
import cx from '@/app/components/ui/cx';
import { authFetch } from '@/lib/apiClient';

/** Numbered step card used down the left panel of the builder. */
export function Step({ n, title, hint, children, active, onFocus }) {
  return (
    <section
      onFocusCapture={onFocus}
      onClick={onFocus}
      className={cx(
        'rounded-xl border bg-canvas p-4 transition-shadow',
        active ? 'border-brand/40 shadow-[0_0_0_3px_rgba(29,75,62,0.08)]' : 'border-line'
      )}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <span className={cx('mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', active ? 'bg-brand text-white' : 'bg-brand-tint text-brand-ink')}>{n}</span>
        <div>
          <h3 className="text-[13.5px] font-semibold text-fg">{title}</h3>
          {hint && <p className="mt-0.5 text-[12px] leading-snug text-fg-tertiary">{hint}</p>}
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

/** Radio-style option row. */
export function Choice({ checked, onSelect, label, desc, icon: Icon, badge }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cx(
        'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
        checked ? 'border-brand bg-brand-tint/60' : 'border-line hover:border-line-strong hover:bg-subtle'
      )}
    >
      <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', checked ? 'border-brand' : 'border-line-strong')}>
        {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
          {Icon && <Icon className="h-3.5 w-3.5 text-brand-ink" />}
          {label}
          {badge}
        </span>
        {desc && <span className="mt-0.5 block text-[12px] leading-snug text-fg-tertiary">{desc}</span>}
      </span>
    </button>
  );
}

/** Keyword chips: type and press Enter or comma. */
export function KeywordInput({ value = [], onChange, placeholder = 'Type a word and press Enter', examples = [] }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const words = String(raw).split(',').map((w) => w.trim()).filter(Boolean);
    if (!words.length) return;
    const next = [...value];
    for (const w of words) if (!next.some((v) => v.toLowerCase() === w.toLowerCase())) next.push(w);
    onChange(next.slice(0, 20));
    setDraft('');
  };
  return (
    <div>
      <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border border-line bg-canvas px-2 py-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
        {value.map((k) => (
          <span key={k} className="inline-flex items-center gap-1 rounded-md bg-brand-tint px-2 py-0.5 text-[12px] font-medium text-brand-ink">
            {k}
            <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange(value.filter((v) => v !== k))} className="text-brand-ink/60 hover:text-brand-ink">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-[13px] text-fg outline-none placeholder:text-fg-tertiary"
        />
      </div>
      {examples.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-fg-tertiary">
          For example:
          {examples.map((ex) => (
            <button key={ex} type="button" onClick={() => add(ex)} className="rounded-full border border-line px-2.5 py-0.5 text-fg-secondary hover:border-brand hover:text-brand-ink">
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Up to `max` variations stored as one "a ||| b ||| c" string (picked at random per send). */
export function VariationsInput({ value = '', onChange, max = 3, placeholders = [] }) {
  const parts = String(value).split('|||').map((p) => p.trim());
  const rows = parts.length ? parts : [''];
  const set = (i, v) => {
    const next = [...rows];
    next[i] = v;
    onChange(next.map((p) => p.trim()).filter((p, idx) => p || idx === 0).join(' ||| '));
  };
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="relative">
          <input
            value={r}
            onChange={(e) => set(i, e.target.value)}
            placeholder={placeholders[i] || 'Another way to say it'}
            maxLength={300}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 pr-8 text-[13px] text-fg outline-none placeholder:text-fg-tertiary focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          {i > 0 && (
            <button type="button" aria-label="Remove variation" onClick={() => onChange(rows.filter((_, k) => k !== i).join(' ||| '))} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {rows.length < max && rows[rows.length - 1] && (
        <button type="button" onClick={() => onChange(`${rows.join(' ||| ')} ||| `)} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-ink hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add a variation
        </button>
      )}
      <p className="text-[11.5px] text-fg-tertiary">A different one is picked each time, so replies don&apos;t look copy-pasted.</p>
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4, maxLength = 1000 }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-tertiary focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <p className="mt-0.5 text-right text-[11px] text-fg-tertiary">{(value || '').length}/{maxLength}</p>
    </div>
  );
}

/** Small toggle row ("Reply publicly under the comment  [switch]"). */
export function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-fg">{label}</p>
        {desc && <p className="text-[12px] text-fg-tertiary">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line-strong')}
      >
        <span className={cx('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
    </div>
  );
}

function Thumb({ src, type, className }) {
  const [failed, setFailed] = useState(false);
  const Fallback = type === 'reel' || type === 'video' ? Film : ImageIcon;
  if (!src || failed) return <div className={cx('flex items-center justify-center bg-muted text-fg-tertiary', className)}><Fallback className="h-4 w-4" /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cx('object-cover', className)} />;
}

/** "Which post": a specific post (thumbnail grid) · any post · next post. */
export function PostScope({ rule, set }) {
  const scope = rule.scope || 'specific';
  const [state, setState] = useState({ status: 'idle', posts: [], error: '' });
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setState({ status: 'loading', posts: [], error: '' });
    try {
      const res = await authFetch('/api/business/settings/social-posts?channel=instagram');
      const data = await res.json();
      if (data.success) setState({ status: 'ready', posts: data.data.posts || [], error: '' });
      else setState({ status: 'error', posts: [], error: data.needsReconnect ? 'Reconnect Instagram so we can see your posts.' : (data.error || 'Could not load posts') });
    } catch {
      setState({ status: 'error', posts: [], error: 'Could not load posts' });
    }
  };

  useEffect(() => {
    if (scope === 'specific' && state.status === 'idle') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const clear = { mediaId: '', mediaThumb: '', mediaCaption: '', mediaPermalink: '' };
  const posts = showAll ? state.posts : state.posts.slice(0, 8);

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Which post">
      <Choice checked={scope === 'specific'} onSelect={() => set({ scope: 'specific', rearm: false })} icon={MousePointerClick} label="A specific post or reel" />
      {scope === 'specific' && (
        <div className="rounded-lg border border-line bg-subtle p-2.5">
          {state.status === 'loading' && <p className="flex items-center justify-center gap-2 py-5 text-[12px] text-fg-tertiary"><Loader2 className="h-4 w-4 animate-spin" /> Loading your posts…</p>}
          {state.status === 'error' && (
            <div className="flex items-start gap-2 text-[12px] text-warning">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{state.error}</span>
              <button type="button" onClick={load} className="text-fg-secondary hover:text-fg" aria-label="Retry"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {state.status === 'ready' && !state.posts.length && <p className="py-4 text-center text-[12px] text-fg-tertiary">No posts on this account yet.</p>}
          {state.status === 'ready' && state.posts.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {posts.map((p) => {
                  const active = String(rule.mediaId) === String(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={p.caption || 'Post'}
                      onClick={() => set({ scope: 'specific', mediaId: p.id, mediaThumb: p.thumbnail || '', mediaCaption: p.caption || '', mediaPermalink: p.permalink || '' })}
                      className={cx('relative overflow-hidden rounded-md', active ? 'ring-2 ring-brand ring-offset-1 ring-offset-subtle' : 'opacity-90 hover:opacity-100')}
                    >
                      <Thumb src={p.thumbnail} type={p.type} className="aspect-square w-full" />
                      {p.type === 'reel' && <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[8.5px] font-semibold text-white">REEL</span>}
                      {active && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white"><Check className="h-2.5 w-2.5" /></span>}
                    </button>
                  );
                })}
              </div>
              {state.posts.length > 8 && (
                <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 w-full text-center text-[12px] font-medium text-brand-ink hover:underline">
                  {showAll ? 'Show fewer' : `Show all ${state.posts.length}`}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <Choice checked={scope === 'all'} onSelect={() => set({ scope: 'all', ...clear })} icon={LayoutGrid} label="Any post or reel" desc="Every post, including ones you publish later." />
      <Choice checked={scope === 'next'} onSelect={() => set({ scope: 'next', ...clear, rearm: true })} icon={CalendarClock} label="My next post or reel" desc="Attaches to whatever you publish next." />
    </div>
  );
}
