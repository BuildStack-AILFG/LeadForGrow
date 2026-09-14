'use client';

import Link from 'next/link';
import { ArrowRight, Clock, Search, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';
import { BLOG_AUTHORS, FEATURE_CATEGORIES, featureArticles } from './featureData';

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      toast.success('Subscribed! Check your inbox for confirmation.');
      setEmail('');
      setLoading(false);
    }, 600);
  };

  return (
    <section className="border-t border-emerald-100 bg-gradient-to-br from-[#FAFDFA] to-emerald-50/30 py-16">
      <div className={`${MARKETING.containerNarrow} text-center`}>
        <Mail className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
        <h2 className={MARKETING.h2}>Stay in the loop</h2>
        <p className={`${MARKETING.body} mt-3 mb-6`}>
          Product updates, automation tips, and growth strategies — delivered monthly. No spam.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="flex-1 px-4 py-3 rounded-xl border border-emerald-200 bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none text-sm"
          />
          <button type="submit" disabled={loading} className={`${MARKETING.btnGreen} shrink-0 disabled:opacity-60`}>
            {loading ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = activeCategory === 'All'
      ? featureArticles
      : featureArticles.filter((a) => a.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, query]);

  return (
    <MarketingShell>
      <section className={`${MARKETING.section} relative overflow-hidden pt-28 sm:pt-32`}>
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#EEF8ED] via-[#FAFDFA] to-white" />
        <div className={`${MARKETING.containerNarrow} relative text-center`}>
          <p className={MARKETING.overline}>Blog</p>
          <h1 className={`${MARKETING.h1} mt-3`}>Platform & automation guides</h1>
          <p className={`${MARKETING.bodyLarge} mt-4 mx-auto max-w-2xl`}>
            Explore how LeadForGrow helps you capture leads, automate conversations, and close more deals.
          </p>
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides…"
              aria-label="Search blog articles"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-emerald-100 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none text-sm"
            />
          </div>
        </div>
      </section>

      <section className={`${MARKETING.container} pb-16`}>
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {FEATURE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? 'bg-[#111827] text-white'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:border-emerald-200 hover:bg-[#FAFDFA] hover:text-emerald-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-[#64748B] py-12">No articles match your search.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {filtered.map((article) => {
              const author = BLOG_AUTHORS[article.author];
              return (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className={`${MARKETING.card} ${MARKETING.cardHover} group flex flex-col p-6`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-[#94A3B8]">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readTime}
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-bold tracking-tight text-[#111827] group-hover:text-emerald-800">
                    {article.title}
                  </h2>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#64748B]">{article.excerpt}</p>
                  {author && (
                    <p className="mt-3 text-xs text-[#94A3B8]">
                      By{' '}
                      <span className="text-emerald-700 font-medium">{author.name}</span>
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    Read guide
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          {Object.values(BLOG_AUTHORS).map((author) => (
            <Link
              key={author.slug}
              href={`/blog/author/${author.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {author.initials}
              </span>
              {author.name}
            </Link>
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </MarketingShell>
  );
}
