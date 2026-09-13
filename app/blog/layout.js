import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Blog — CRM, AI Agents, WhatsApp & Instagram Automation Guides',
  description:
    'Practical guides on CRM, AI agents, WhatsApp automation, and Instagram automation for growing businesses — from LeadForGrow.',
  path: '/blog',
  keywords: [
    'crm blog',
    'ai agent guides',
    'whatsapp automation guides',
    'instagram automation guides',
    'business automation blog',
  ],
});

export default function BlogLayout({ children }) {
  return children;
}
