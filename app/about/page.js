import AboutPageContent from '@/app/components/marketing/AboutPageContent';

export const metadata = {
  title: 'About Us',
  description:
    'LeadForGrow is a SaaS platform developed and operated by ScaleDesk Technology Private Limited. Learn about our mission, vision, values, and journey.',
  openGraph: {
    title: 'About LeadForGrow',
    description: 'Turning leads into customers with AI-powered CRM and automation.',
  },
  alternates: {
    canonical: 'https://www.leadforgrow.com/about',
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}
