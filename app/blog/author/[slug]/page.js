import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';
import { BLOG_AUTHORS, getArticlesByAuthor } from '@/app/blog/featureData';

export function generateStaticParams() {
  return Object.keys(BLOG_AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = BLOG_AUTHORS[slug];
  if (!author) return { title: 'Author Not Found | LeadForGrow' };
  return {
    title: `${author.name} | LeadForGrow Blog`,
    description: author.bio,
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const author = BLOG_AUTHORS[slug];
  if (!author) notFound();

  const articles = getArticlesByAuthor(slug);

  return (
    <MarketingShell>
      <section className={`${MARKETING.section} pt-28 sm:pt-32`}>
        <div className={`${MARKETING.containerNarrow}`}>
          <Link href="/blog" className="text-sm text-emerald-700 hover:text-emerald-800 mb-8 inline-block">
            ← Back to blog
          </Link>
          <div className="flex items-start gap-6">
            <span className="w-16 h-16 rounded-2xl bg-emerald-600 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {author.initials}
            </span>
            <div>
              <h1 className={MARKETING.h1}>{author.name}</h1>
              <p className="text-emerald-700 font-medium mt-1">{author.role}</p>
              <p className={`${MARKETING.body} mt-4 max-w-xl`}>{author.bio}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${MARKETING.containerNarrow} pb-16`}>
        <h2 className={`${MARKETING.h3} mb-6`}>
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </h2>
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className={`${MARKETING.card} ${MARKETING.cardHover} block p-6 group`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase text-emerald-700">{article.category}</span>
                <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                  <Clock className="w-3.5 h-3.5" /> {article.readTime}
                </span>
              </div>
              <h3 className="font-semibold text-[#111827] group-hover:text-emerald-800">{article.title}</h3>
              <p className="text-sm text-[#64748B] mt-2 line-clamp-2">{article.excerpt}</p>
              <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-emerald-700">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
