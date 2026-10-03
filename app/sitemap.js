import { getAllSlugs } from '@/lib/blog/posts';
import { FOOTER_SECTIONS, FOOTER_LEGAL } from '@/lib/marketing/footerLinks';
import { HELP_GUIDES } from '@/lib/help/guides';
import { industries } from '@/app/industry/data';
import { SITE_URL } from '@/lib/seo/metadata';

const STATIC_ROUTES = [
  '/', '/pricing', '/blog', '/help', '/about', '/contact', '/register', '/login',
  '/privacy', '/terms', '/gdpr', '/cookie-policy', '/refund-policy', '/dpa', '/security', '/compliance',
];

export default function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }));

  const blogEntries = getAllSlugs().map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
  }));

  // Every footer page is its own static page; list each internal one once.
  const listed = new Set(STATIC_ROUTES);
  const footerEntries = [...FOOTER_SECTIONS.flatMap((s) => s.links), ...FOOTER_LEGAL]
    .map((l) => l.href)
    .filter((href) => href.startsWith('/') && !listed.has(href) && listed.add(href))
    .map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now }));

  const helpEntries = HELP_GUIDES.map((guide) => ({
    url: `${SITE_URL}/help/${guide.slug}`,
    lastModified: now,
  }));

  const industryEntries = Object.keys(industries).map((slug) => ({
    url: `${SITE_URL}/industry/${slug}`,
    lastModified: now,
  }));

  return [
    ...staticEntries,
    ...blogEntries,
    ...footerEntries,
    ...helpEntries,
    ...industryEntries,
  ];
}
