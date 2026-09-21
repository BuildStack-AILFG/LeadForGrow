'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, MousePointerClick, CalendarClock, Loader2, RefreshCw, Check, Image as ImageIcon, Film, ExternalLink, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

/**
 * "Which post does this automation apply to?" — built so a non-technical client
 * never sees an ID: pick "any post", click a thumbnail of one of their own recent
 * posts, or say "my next post" and it attaches itself once they publish.
 */
const SCOPE_OPTIONS = (noun) => [
  { id: 'all', icon: LayoutGrid, title: `Any ${noun}`, desc: `Every ${noun}, including ones you publish later` },
  { id: 'specific', icon: MousePointerClick, title: 'One post', desc: `Pick from your recent ${noun}s` },
  { id: 'next', icon: CalendarClock, title: `My next ${noun}`, desc: 'Starts working on whatever you publish next' },
];

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(String(ts).replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function Thumb({ src, type, className = '' }) {
  const [failed, setFailed] = useState(false);
  const Fallback = type === 'reel' || type === 'video' ? Film : ImageIcon;
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
        <Fallback className="w-5 h-5" />
      </div>
    );
  }
  // Meta CDN URLs are signed and expire, so we can't proxy/cache them — fall back to an icon.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

function SelectedPost({ rule, right }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2">
      <Thumb src={rule.mediaThumb} className="w-12 h-12 rounded-md shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">{rule.mediaCaption || 'Post selected'}</p>
        {rule.mediaPermalink && (
          <a href={rule.mediaPermalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
            View post <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {right}
    </div>
  );
}

function PostPicker({ channel, cfg, selectedId, onPick, onClose, onManualId }) {
  const [state, setState] = useState({ status: 'loading', posts: [], error: '', needsReconnect: false });
  const [manual, setManual] = useState('');

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await authFetch(`/api/business/settings/social-posts?channel=${channel}`);
      const data = await res.json();
      if (data.success) setState({ status: 'ready', posts: data.data.posts || [], error: '', needsReconnect: false });
      else setState({ status: 'error', posts: [], error: data.error || 'Could not load posts', needsReconnect: !!data.needsReconnect });
    } catch {
      setState({ status: 'error', posts: [], error: 'Could not load posts', needsReconnect: false });
    }
  };

  // Load once when the picker opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [channel]);

  return (
    <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Choose a {cfg.postNoun}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={onClose} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Close</button>
        </div>
      </div>

      {state.status === 'loading' && (
        <div className="flex items-center gap-2 py-6 justify-center text-xs text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading your {cfg.postNoun}s…</div>
      )}

      {state.status === 'error' && (
        <div className="space-y-2">
          <div className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {state.needsReconnect
                ? `We can't see your ${cfg.postNoun}s yet — your ${cfg.name} connection needs permission to read them. Reconnect ${cfg.name} above, or choose “Any ${cfg.postNoun}” for now.`
                : `Couldn't load your ${cfg.postNoun}s. Try again, or choose “Any ${cfg.postNoun}”.`}
              <span className="block text-[10px] text-amber-700/70 dark:text-amber-300/70 mt-1">{state.error}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Advanced: paste a post ID"
              className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 outline-none"
            />
            <button type="button" disabled={!manual.trim()} onClick={() => onManualId(manual.trim())} className="px-2.5 py-1.5 text-[11px] border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-40">Use</button>
          </div>
        </div>
      )}

      {state.status === 'ready' && (state.posts.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No {cfg.postNoun}s found on this account yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
          {state.posts.map((p) => {
            const active = String(selectedId || '') === String(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p)}
                className={`relative text-left rounded-md overflow-hidden border ${active ? 'border-2 border-emerald-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
              >
                <Thumb src={p.thumbnail} type={p.type} className="w-full aspect-square" />
                {p.type === 'reel' && <span className="absolute top-1 left-1 text-[9px] font-semibold bg-black/60 text-white px-1 py-0.5 rounded">REEL</span>}
                {active && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                <div className="p-1.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">{p.caption || 'No caption'}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{fmtDate(p.timestamp)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function PostScopeField({ rule, set, channel, cfg }) {
  const scope = rule.scope || (rule.mediaId ? 'specific' : 'all');
  const [picking, setPicking] = useState(false);
  const options = SCOPE_OPTIONS(cfg.postNoun);
  const clearPost = { mediaId: '', mediaThumb: '', mediaCaption: '', mediaPermalink: '' };

  const chooseScope = (next) => {
    if (next === scope) return;
    setPicking(next === 'specific');
    // Entering 'next' (re)starts its clock server-side via rearm.
    set({ scope: next, ...clearPost, rearm: next === 'next' });
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">On which {cfg.postNoun}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = scope === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => chooseScope(opt.id)}
              className={`text-left rounded-lg border p-2.5 transition-colors ${active ? cfg.accent.scopeActive : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <Icon className="w-3.5 h-3.5" /> {opt.title}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      {scope === 'specific' && (
        <div className="mt-2">
          {rule.mediaId && !picking ? (
            <SelectedPost
              rule={rule}
              right={<button type="button" onClick={() => setPicking(true)} className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md">Change</button>}
            />
          ) : !picking ? (
            <button type="button" onClick={() => setPicking(true)} className="w-full py-2.5 text-xs font-medium border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Choose a {cfg.postNoun}
            </button>
          ) : null}
          {picking && (
            <PostPicker
              channel={channel}
              cfg={cfg}
              selectedId={rule.mediaId}
              onClose={() => setPicking(false)}
              onPick={(p) => {
                set({ scope: 'specific', mediaId: p.id, mediaThumb: p.thumbnail || '', mediaCaption: p.caption || '', mediaPermalink: p.permalink || '' });
                setPicking(false);
              }}
              onManualId={(id) => { set({ scope: 'specific', mediaId: id, mediaThumb: '', mediaCaption: '', mediaPermalink: '' }); setPicking(false); }}
            />
          )}
        </div>
      )}

      {scope === 'next' && (
        <div className="mt-2">
          {rule.mediaId ? (
            <SelectedPost
              rule={rule}
              right={
                <button type="button" onClick={() => set({ ...clearPost, rearm: true })} className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md whitespace-nowrap">
                  Use on my next {cfg.postNoun} instead
                </button>
              }
            />
          ) : (
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5">
              <b>Waiting for your next {cfg.postNoun}.</b> After you save, publish a new {cfg.postNoun} on {cfg.name} — this automation attaches to it
              automatically when the first matching comment arrives. Older posts are ignored.
            </p>
          )}
        </div>
      )}

      {scope === 'all' && (
        <p className="text-[11px] text-slate-400 mt-1.5">Comments on older {cfg.postNoun}s will also trigger this automation.</p>
      )}
    </div>
  );
}
