import FoundersPage from '@/app/components/landing/FoundersPage';
import { COMPANY, FOUNDERS } from '@/lib/founders/data';

const PAGE_URL = `${COMPANY.siteUrl}/founders`;

export const metadata = {
  title: 'Founders & Co-Founders | LeadForGrow — S.Singh, Honey Singh, S.S Chauhan',
  description:
    'Meet the LeadForGrow co-founders: S.Singh (Co-Founder & CTO), Honey Singh, and S.S Chauhan. Learn about the team behind India\'s AI-powered CRM and sales automation platform by Scaledesk Technology.',
  keywords: [
    'LeadForGrow founders',
    'LeadForGrow co-founders',
    'S.Singh LeadForGrow',
    'Honey Singh LeadForGrow',
    'S.S Chauhan LeadForGrow',
    'Scaledesk Technology founders',
    'LeadForGrow team',
    'CRM founders India',
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Meet the LeadForGrow Co-Founders',
    description:
      'S.Singh, Honey Singh, and S.S Chauhan — the team building AI-powered CRM and sales automation for 1100+ businesses.',
    url: PAGE_URL,
    type: 'website',
    siteName: 'LeadForGrow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadForGrow Founders & Leadership Team',
    description:
      'Meet the co-founders behind LeadForGrow — AI CRM, Meta Lead Ads, and WhatsApp automation.',
  },
};

function FoundersJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    url: COMPANY.siteUrl,
    description: COMPANY.tagline,
    parentOrganization: {
      '@type': 'Organization',
      name: COMPANY.parent,
    },
    founder: FOUNDERS.map((founder) => ({
      '@type': 'Person',
      name: founder.name,
      jobTitle: founder.role,
      url: founder.linkedin,
      worksFor: {
        '@type': 'Organization',
        name: COMPANY.name,
      },
    })),
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'LeadForGrow Founders',
    description: metadata.description,
    url: PAGE_URL,
    isPartOf: {
      '@type': 'WebSite',
      name: COMPANY.name,
      url: COMPANY.siteUrl,
    },
    about: FOUNDERS.map((f) => ({ '@type': 'Person', name: f.name, jobTitle: f.role })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
    </>
  );
}

export default function FoundersRoutePage() {
  return (
    <>
      <FoundersJsonLd />
      <FoundersPage />
    </>
  );
}
