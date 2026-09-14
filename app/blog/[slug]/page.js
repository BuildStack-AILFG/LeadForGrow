import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import FeatureBlogShell, { FeatureHighlights } from '@/app/components/landing/FeatureBlogShell';
import ReadingProgress from '@/app/components/marketing/ReadingProgress';
import { featureArticles, getAuthor, getFeatureBySlug, getRelatedArticles } from '@/app/blog/featureData';

export function generateStaticParams() {
  return featureArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getFeatureBySlug(slug);

  if (!article) {
    return { title: 'Guide Not Found | LeadForGrow' };
  }

  return {
    title: `${article.title} | LeadForGrow`,
    description: article.excerpt,
  };
}

export default async function FeatureBlogPage({ params }) {
  const { slug } = await params;
  const article = getFeatureBySlug(slug);

  if (!article) {
    return (
      <FeatureBlogShell>
        <div className="mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#111827]">Guide not found</h1>
          <Link href="/blog" className="mt-4 inline-block text-emerald-700 hover:text-emerald-800">
            Back to all guides
          </Link>
        </div>
      </FeatureBlogShell>
    );
  }

  const author = getAuthor(article.author);
  const related = getRelatedArticles(slug);

  return (
    <>
      <ReadingProgress />
      <FeatureBlogShell>
        <article className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
          <header className="border-b border-[#E2E8F0] pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-[13px] text-[#94A3B8]">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime}
              </span>
            </div>
            <h1
              className="mt-4 text-[1.85rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#111827] sm:text-[2.25rem]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              {article.title}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">{article.excerpt}</p>
            {author && (
              <Link
                href={`/blog/author/${author.slug}`}
                className="mt-6 inline-flex items-center gap-3 group"
              >
                <span className="w-10 h-10 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">
                  {author.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#111827] group-hover:text-emerald-800 transition-colors">
                    {author.name}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{author.role}</span>
                </span>
              </Link>
            )}
          </header>

          <div className="prose-custom mt-8 space-y-8">
            <p className="rounded-2xl border border-emerald-100 bg-[#FAFDFA] px-5 py-4 text-[16px] leading-relaxed text-[#374151]">
              {article.intro}
            </p>

            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2
                  className="text-xl font-bold tracking-tight text-[#111827]"
                  style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                >
                  {section.heading}
                </h2>
                <p className="mt-3 text-[16px] leading-relaxed text-[#4B5563]">{section.body}</p>
              </section>
            ))}

            <section>
              <h2
                className="text-xl font-bold tracking-tight text-[#111827]"
                style={{ fontFamily: 'var(--font-plus-jakarta)' }}
              >
                Key capabilities
              </h2>
              <FeatureHighlights items={article.highlights} />
            </section>
          </div>

          {related.length > 0 && (
            <section className="mt-12 pt-8 border-t border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#111827] mb-5">Related guides</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group rounded-xl border border-[#E2E8F0] p-4 hover:border-emerald-200 hover:bg-[#FAFDFA] transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase text-emerald-700">{r.category}</span>
                    <p className="mt-2 text-sm font-semibold text-[#111827] group-hover:text-emerald-800 line-clamp-2">
                      {r.title}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-[#E2E8F0] pt-8">
            <Link
              href="/pricing"
              className="rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              View pricing
            </Link>
            <Link
              href="/blog"
              className="rounded-xl border border-[#D4D4D4] px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-emerald-300 hover:bg-[#ECFDF5]"
            >
              More guides
            </Link>
          </div>
        </article>
      </FeatureBlogShell>
    </>
  );
}
