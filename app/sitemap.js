import { getAllSlugs } from '@/lib/blog/posts';
import { PRODUCT_PAGES, SOLUTION_PAGES } from '@/lib/marketing/pageContent/products';
import { HELP_GUIDES } from '@/lib/help/guides';
import { industries } from '@/app/industry/data';
import { SITE_URL } from '@/lib/seo/metadata';

const STATIC_ROUTES = ['/', '/pricing', '/blog', '/help', '/about', '/register', '/login'];

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

  const productEntries = Object.keys(PRODUCT_PAGES).map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: now,
  }));

  const solutionEntries = Object.keys(SOLUTION_PAGES).map((slug) => ({
    url: `${SITE_URL}/solutions/${slug}`,
    lastModified: now,
  }));

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
    ...productEntries,
    ...solutionEntries,
    ...helpEntries,
    ...industryEntries,
  ];
}
