'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Loader2, Info } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

const RATING_META = {
  GREEN:   { label: 'Green — Healthy',    tone: 'emerald', Icon: ShieldCheck, hint: 'Your business quality is good. Send freely, but keep improving engagement.' },
  YELLOW:  { label: 'Yellow — Warning',   tone: 'amber',   Icon: AlertTriangle, hint: 'Meta is flagging some of your sends. Reduce volume, prefer Utility templates, and only send to leads who messaged you recently.' },
  RED:     { label: 'Red — Low quality',  tone: 'red',     Icon: AlertTriangle, hint: 'Meta is heavily throttling your sends. Pause big broadcasts for 1-2 weeks. Send only to engaged, opted-in leads.' },
  UNKNOWN: { label: 'Unknown',            tone: 'slate',   Icon: Info,          hint: 'Meta has not calculated a rating yet — usually because your number is new.' },
};

const TIER_LABELS = {
  TIER_50:        '50 msgs / 24h',
  TIER_250:       '250 msgs / 24h',
  TIER_1K:        '1,000 msgs / 24h',
  TIER_10K:       '10,000 msgs / 24h',
  TIER_100K:      '100,000 msgs / 24h',
  TIER_UNLIMITED: 'Unlimited',
};

const TONE_CLASSES = {
  emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300',
  amber:   'border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300',
  red:     'border-red-200 bg-red-50/60 text-red-900 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300',
  slate:   'border-slate-200 bg-slate-50/60 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
};

export default function QualityRatingBanner({ audienceCount, className = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const url = `/api/automation/whatsapp/quality-check${refresh ? '?refresh=1' : ''}`;
      const res = await authFetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load quality rating');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(false); }, []);

  if (loading) {
    return (
      <div className={`rounded border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500 flex items-center gap-2 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Meta quality rating…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-500 ${className}`}>
        Could not fetch quality rating: {error}
      </div>
    );
  }

  const rating = data?.qualityRating || 'UNKNOWN';
  const meta = RATING_META[rating] || RATING_META.UNKNOWN;
  const Icon = meta.Icon;
  const tier = data?.messagingLimitTier;

  // Over-limit warning: if audience > current tier cap, hard-warn
  const tierCap = tier === 'TIER_50' ? 50 : tier === 'TIER_250' ? 250 : tier === 'TIER_1K' ? 1000 : tier === 'TIER_10K' ? 10000 : tier === 'TIER_100K' ? 100000 : Infinity;
  const overLimit = audienceCount && audienceCount > tierCap;

  return (
    <div className={`rounded border p-3 space-y-2 ${TONE_CLASSES[meta.tone]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold">Meta quality · {meta.label}</p>
            {tier && (
              <p className="text-[11px] opacity-80 mt-0.5">
                Daily send tier: <span className="font-medium">{TIER_LABELS[tier] || tier}</span>
                {data?.displayPhoneNumber && <span> · from {data.displayPhoneNumber}</span>}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-1 rounded hover:bg-white/40 dark:hover:bg-slate-800/40 shrink-0"
          title="Re-check quality from Meta"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-[11px] opacity-90 leading-relaxed">{meta.hint}</p>

      {overLimit && (
        <p className="text-[11px] font-semibold border-t border-current/20 pt-2">
          ⚠ This audience ({audienceCount}) is above your daily tier cap ({tierCap}). Meta will drop excess sends. Reduce audience or wait for tier upgrade.
        </p>
      )}
    </div>
  );
}
