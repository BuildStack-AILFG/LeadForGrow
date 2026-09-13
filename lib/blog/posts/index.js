import { featureArticles } from '@/app/blog/featureData';
import { whatsappAutomationPosts } from './whatsapp-automation';
import { instagramAutomationPosts } from './instagram-automation';
import { crmPosts } from './crm';
import { aiAgentPosts } from './ai-agents';
import { businessAutomationPosts } from './business-automation';

function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Wrap a legacy `featureArticles` entry (flat {heading, body: string} sections,
 * no FAQs, no keywords) into the unified post shape so both old and new
 * content render through one template. */
function adaptLegacyArticle(article) {
  return {
    slug: article.slug,
    category: article.category,
    title: article.title,
    metaDescription: article.excerpt,
    keywords: [],
    excerpt: article.excerpt,
    author: article.author,
    publishedAt: '2026-01-01',
    updatedAt: '2026-01-01',
    readTime: article.readTime,
    intro: [article.intro],
    sections: (article.sections || []).map((s) => ({
      id: slugifyHeading(s.heading),
      heading: s.heading,
      level: 2,
      body: [s.body],
    })),
    faqs: [],
    highlights: article.highlights,
    legacy: true,
  };
}

const NEW_POSTS = [
  ...whatsappAutomationPosts,
  ...instagramAutomationPosts,
  ...crmPosts,
  ...aiAgentPosts,
  ...businessAutomationPosts,
];

export const ALL_POSTS = [...featureArticles.map(adaptLegacyArticle), ...NEW_POSTS];

export function getPostBySlug(slug) {
  return ALL_POSTS.find((p) => p.slug === slug) || null;
}

export function getAllSlugs() {
  return ALL_POSTS.map((p) => p.slug);
}

export function getAllCategories() {
  return ['All', ...new Set(ALL_POSTS.map((p) => p.category))];
}

export function getPostsByCategory(category) {
  if (!category || category === 'All') return ALL_POSTS;
  return ALL_POSTS.filter((p) => p.category === category);
}

export function getPostsByAuthor(authorSlug) {
  return ALL_POSTS.filter((p) => p.author === authorSlug);
}

/** Lightweight metadata only (no sections/faqs) — safe for the listing page's
 * client bundle even once there are hundreds of posts. */
export function getAllPostsMeta() {
  return ALL_POSTS.map(({ sections, faqs, intro, ...meta }) => meta);
}

export const CATEGORY_LABELS = {
  'whatsapp-automation': 'WhatsApp Automation',
  'instagram-automation': 'Instagram Automation',
  crm: 'CRM',
  'ai-agents': 'AI Agents',
  'business-automation': 'Business Automation',
};

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function getRelatedPosts(slug, limit = 3) {
  const current = getPostBySlug(slug);
  if (!current) return [];
  if (current.relatedSlugs?.length) {
    return current.relatedSlugs.map((s) => getPostBySlug(s)).filter(Boolean).slice(0, limit);
  }
  return ALL_POSTS.filter((p) => p.slug !== slug && p.category === current.category).slice(0, limit);
}
