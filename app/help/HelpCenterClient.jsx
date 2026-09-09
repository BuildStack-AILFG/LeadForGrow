'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, ArrowLeft, ArrowRight, Clock, Rocket, MessageCircle, Workflow,
  IndianRupee, SlidersHorizontal, Sparkles, ChevronRight, Mail, PhoneCall,
  Users2, BarChart3,
} from 'lucide-react';
import { HELP_CATEGORIES, HELP_GUIDES } from '@/lib/help/guides';
import RecentAndPopular from './RecentAndPopular';
import FeatureTours from './FeatureTours';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '../automation/components/chat/BrandIcons';

// Real Lucide icons per category — replaces the previous emoji-only headers.
// Colours picked so every category has a distinct visual anchor without
// leaning into the AI-marketing gradient look the user flagged earlier.
// Icons chosen to be semantically specific (not generic stock):
//   - Workflow — the connected-nodes flowchart shape actually shows what
//     automation IS, unlike a lightning bolt.
//   - IndianRupee — LFG's market is India, ₹ is instantly recognised by
//     every SMB owner as "money / bills" without any translation.
//   - SlidersHorizontal — mixer-desk controls read as "adjust settings"
//     more concretely than a generic gear which every app uses.
const CATEGORY_META = {
  'get-started':   { Icon: Rocket,             tone: 'blue',    tint: 'from-blue-500/20 to-blue-500/5',       ring: 'ring-blue-500/20' },
  'crm':           { Icon: Users2,             tone: 'indigo',  tint: 'from-indigo-500/20 to-indigo-500/5',   ring: 'ring-indigo-500/20' },
  'communication': { Icon: MessageCircle,      tone: 'emerald', tint: 'from-emerald-500/20 to-emerald-500/5', ring: 'ring-emerald-500/20' },
  'automation':    { Icon: Workflow,           tone: 'amber',   tint: 'from-amber-500/20 to-amber-500/5',     ring: 'ring-amber-500/20' },
  'ai':            { Icon: Sparkles,           tone: 'purple',  tint: 'from-purple-500/20 to-purple-500/5',   ring: 'ring-purple-500/20' },
  'insights':      { Icon: BarChart3,          tone: 'cyan',    tint: 'from-cyan-500/20 to-cyan-500/5',       ring: 'ring-cyan-500/20' },
  'commerce':      { Icon: IndianRupee,        tone: 'violet',  tint: 'from-violet-500/20 to-violet-500/5',   ring: 'ring-violet-500/20' },
  'settings':      { Icon: SlidersHorizontal,  tone: 'slate',   tint: 'from-slate-500/20 to-slate-500/5',     ring: 'ring-slate-500/20' },
};

const TONE_TEXT = {
  blue: 'text-blue-600', indigo: 'text-indigo-600', emerald: 'text-emerald-600',
  amber: 'text-amber-600', violet: 'text-violet-600', purple: 'text-purple-600',
  cyan: 'text-cyan-600', slate: 'text-slate-600',
};
const TONE_BG_SOFT = {
  blue: 'bg-blue-50', indigo: 'bg-indigo-50', emerald: 'bg-emerald-50',
  amber: 'bg-amber-50', violet: 'bg-violet-50', purple: 'bg-purple-50',
  cyan: 'bg-cyan-50', slate: 'bg-slate-100',
};

export default function HelpCenterClient() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return HELP_GUIDES;
    return HELP_GUIDES.filter((g) =>
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      (g.prereqs || []).some((p) => p.toLowerCase().includes(q))
    );
  }, [q]);

  const featured = HELP_GUIDES.find((g) => g.slug === 'getting-started');

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px]">L</span>
            LeadForGrow
          </Link>
          <Link href="/automation" className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to app
          </Link>
        </div>
      </div>

      {/* ── Hero — photo banner with overlaid heading + search ────────── */}
      <header className="relative">
        <div className="relative h-[300px] sm:h-[360px] w-full overflow-hidden">
          <img
            src="https://images.pexels.com/photos/8192185/pexels-photo-8192185.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/55 to-slate-900/70" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" /> Help Center
            </span>
            <h1 className="text-3xl sm:text-[42px] font-semibold tracking-tight text-white leading-[1.1]">
              How can we help you today?
            </h1>
            <p className="text-slate-200 mt-3 text-base sm:text-lg leading-relaxed max-w-2xl">
              Every feature, explained step by step. Search for what you need or browse by category.
            </p>
          </div>
        </div>

        {/* Search — floats over the banner/body seam */}
        <div className="relative max-w-xl mx-auto px-4 -mt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides — templates, broadcast, bill…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 text-sm placeholder:text-slate-400 border border-slate-200 shadow-lg shadow-slate-900/10 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-300"
            />
            {q && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pt-10 pb-12">
        {/* Featured — only shown when no search is active */}
        {featured && !q && (
          <FeaturedGuide guide={featured} />
        )}

        {!q && <RecentAndPopular allGuides={HELP_GUIDES} />}

        {/* Categories or search results */}
        {q ? (
          <SearchResults guides={filtered} />
        ) : (
          <div className="space-y-10">
            {HELP_CATEGORIES.map((cat) => {
              const guides = HELP_GUIDES.filter((g) => g.category === cat.id && g.slug !== 'getting-started');
              if (!guides.length) return null;
              const meta = CATEGORY_META[cat.id] || CATEGORY_META['settings'];
              const Icon = meta.Icon;
              return (
                <section key={cat.id}>
                  <div className="flex items-center gap-3 mb-4">
                    {cat.id === 'communication' ? (
                      <ChannelBrandCluster />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl ${TONE_BG_SOFT[meta.tone]} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${TONE_TEXT[meta.tone]}`} />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{cat.label}</h2>
                      <p className="text-xs text-slate-500">{guides.length} guide{guides.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guides.map((g) => <GuideCard key={g.slug} guide={g} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Guided tours — restart entry point (spec section 3) */}
        {!q && <FeatureTours />}

        {/* Support callout */}
        <SupportCallout />
      </main>
    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────

function FeaturedGuide({ guide }) {
  const meta = CATEGORY_META[guide.category] || CATEGORY_META['get-started'];
  const Icon = meta.Icon;
  return (
    <Link
      href={`/help/${guide.slug}`}
      className={`group block rounded-2xl border border-slate-200 bg-gradient-to-br ${meta.tint} p-6 sm:p-8 mb-10 hover:border-blue-300 transition`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${TONE_BG_SOFT[meta.tone]} ring-4 ${meta.ring} flex items-center justify-center shrink-0`}>
          <Icon className={`w-7 h-7 ${TONE_TEXT[meta.tone]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Start here
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{guide.title}</h2>
          <p className="text-sm text-slate-600 mt-1">{guide.summary}</p>
          <div className="inline-flex items-center gap-1 text-xs text-slate-500 mt-3">
            <Clock className="w-3.5 h-3.5" /> {guide.time}
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-center text-sm font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform">
          Open guide <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function GuideCard({ guide }) {
  const meta = CATEGORY_META[guide.category] || CATEGORY_META['settings'];
  return (
    <Link
      href={`/help/${guide.slug}`}
      className="group relative bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60 transition-all"
    >
      {/* Top accent bar — colour maps to category, subtle */}
      <div className={`absolute top-0 left-5 right-5 h-0.5 rounded-b ${TONE_BG_SOFT[meta.tone]} opacity-80`} />
      <h3 className="font-medium text-slate-900 text-[15px] leading-snug pr-6">
        {guide.title}
      </h3>
      <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{guide.summary}</p>
      <div className="flex items-center justify-between mt-4">
        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 uppercase tracking-wide">
          <Clock className="w-3 h-3" /> {guide.time}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}

/**
 * ChannelBrandCluster — three overlapping brand-marks (WhatsApp / Instagram
 * / Gmail) as the Communication section header. Shows viewers "this is where
 * your real channels live" without a generic chat icon. Each mark sits in a
 * white ring so the coloured logos read clearly on both light and dark
 * surfaces.
 */
function ChannelBrandCluster() {
  const chip = 'w-10 h-10 rounded-full ring-4 ring-white flex items-center justify-center shadow-sm';
  return (
    <div className="flex items-center -space-x-3">
      <div className={`${chip} bg-[#25D366]`} title="WhatsApp">
        <WhatsAppIcon size={20} className="text-white" />
      </div>
      <div className={`${chip} bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]`} title="Instagram">
        <InstagramIcon size={20} className="text-white" />
      </div>
      <div className={`${chip} bg-white border border-slate-200`} title="Gmail">
        <GmailIcon size={20} />
      </div>
    </div>
  );
}

function SearchResults({ guides }) {
  if (!guides.length) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-medium text-slate-700">No guides match your search.</p>
        <p className="text-xs text-slate-500 mt-1">Try a different word, or clear the search to browse all guides.</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Search results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {guides.map((g) => <GuideCard key={g.slug} guide={g} />)}
      </div>
    </div>
  );
}

function SupportCallout() {
  return (
    <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <MessageCircle className="w-6 h-6 text-slate-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">Can't find what you need?</h3>
          <p className="text-slate-500 text-sm mt-1">
            Message our team — we usually reply the same day.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <a
            href="https://wa.me/916366966120"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            <PhoneCall className="w-4 h-4" /> WhatsApp us
          </a>
          <a
            href="mailto:hello@leadforgrow.com"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium"
          >
            <Mail className="w-4 h-4" /> Email
          </a>
        </div>
      </div>
    </div>
  );
}
