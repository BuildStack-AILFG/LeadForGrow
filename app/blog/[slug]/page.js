import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import FeatureBlogShell, { FeatureHighlights } from '@/app/components/landing/FeatureBlogShell';
import ArticleToc from '@/app/components/marketing/ArticleToc';
import ArticleFaq from '@/app/components/marketing/ArticleFaq';
import ReadingProgress from '@/app/components/marketing/ReadingProgress';
import { getAuthor } from '@/app/blog/featureData';
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog/posts';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo/jsonLd';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Guide Not Found' };
  return buildMetadata({
    title: post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
  });
}

function SectionBlock({ section }) {
  const HeadingTag = section.level === 3 ? 'h3' : 'h2';
  return (
    <section id={section.id} className="scroll-mt-24">
      <HeadingTag
        className={
          section.level === 3
            ? 'text-lg font-bold text-[#111827]'
            : 'text-xl font-bold tracking-tight text-[#111827]'
        }
        style={{ fontFamily: 'var(--font-plus-jakarta)' }}
      >
        {section.heading}
      </HeadingTag>
      {(section.body || []).map((para, i) => (
        <p key={i} className="mt-3 text-[16px] leading-relaxed text-[#4B5563]">
          {para}
        </p>
      ))}
      {section.list?.length > 0 && (
        <ul className="mt-3 space-y-2 list-disc pl-5">
          {section.list.map((item, i) => (
            <li key={i} className="text-[15px] leading-relaxed text-[#4B5563]">
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.subsections?.map((sub) => (
        <div key={sub.id} className="mt-6">
          <SectionBlock section={sub} />
        </div>
      ))}
    </section>
  );
}

function buildTocItems(post) {
  const items = [];
  (post.sections || []).forEach((s) => {
    items.push({ id: s.id, label: s.heading });
    (s.subsections || []).forEach((sub) => items.push({ id: sub.id, label: sub.heading, indent: true }));
  });
  if (post.faqs?.length) items.push({ id: 'faqs', label: 'FAQs' });
  return items;
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
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

  const author = getAuthor(post.author);
  const related = getRelatedPosts(slug);
  const wide = !post.legacy;
  const tocItems = buildTocItems(post);

  const articleJsonLd = buildArticleJsonLd(post);
  const faqJsonLd = buildFaqJsonLd(post.faqs);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <FeatureBlogShell wide={wide}>
        <div className={`mx-auto ${wide ? 'max-w-6xl' : 'max-w-3xl'} px-4 pb-12 sm:px-6 lg:px-8`}>
          <div className={wide ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16' : ''}>
            <article className={wide ? 'max-w-[720px] min-w-0' : ''}>
              <header className="border-b border-[#E2E8F0] pb-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] text-[#94A3B8]">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <h1
                  className="mt-4 text-[1.85rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#111827] sm:text-[2.25rem]"
                  style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                >
                  {post.title}
                </h1>
                <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">{post.excerpt}</p>
                {author && (
                  <Link href={`/blog/author/${author.slug}`} className="mt-6 inline-flex items-center gap-3 group">
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
                {post.intro?.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-[#FAFDFA] px-5 py-4 space-y-3">
                    {post.intro.map((para, i) => (
                      <p key={i} className="text-[16px] leading-relaxed text-[#374151]">
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {post.sections.map((section) => (
                  <SectionBlock key={section.id} section={section} />
                ))}

                {post.highlights?.length > 0 && (
                  <section>
                    <h2
                      className="text-xl font-bold tracking-tight text-[#111827]"
                      style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                    >
                      Key capabilities
                    </h2>
                    <FeatureHighlights items={post.highlights} />
                  </section>
                )}

                {post.faqs?.length > 0 && (
                  <section id="faqs" className="scroll-mt-24">
                    <h2
                      className="text-xl font-bold tracking-tight text-[#111827] mb-4"
                      style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                    >
                      Frequently asked questions
                    </h2>
                    <ArticleFaq faqs={post.faqs} />
                  </section>
                )}
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

            {wide && tocItems.length > 0 && (
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <ArticleToc items={tocItems} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </FeatureBlogShell>
    </>
  );
}
