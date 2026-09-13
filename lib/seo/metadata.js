const SITE_URL = 'https://www.leadforgrow.com';

/**
 * Build a Next.js Metadata object with canonical/OG/Twitter wired up
 * consistently. `path` is site-relative, e.g. "/blog/my-post".
 */
export function buildMetadata({ title, description, path = '/', keywords = [], ogImage = '/logo.png' }) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'LeadForGrow',
      images: [{ url: ogImage }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export { SITE_URL };
