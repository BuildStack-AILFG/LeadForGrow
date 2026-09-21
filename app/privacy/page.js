'use client';

import React from 'react';
import MarketingLayout from '@/app/components/MarketingLayout';
import Heading from '@/app/components/ui/Heading';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';

export default function PrivacyPolicy() {
 const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly, including name, email address, phone number, business details, billing information, and data you submit through forms, websites, and automations created on the platform."
  },
  {
    title: "2. Lead & Business Data",
    content:
      "All leads, contacts, and business data captured through LeadForGrow remain your property. We process this data solely to provide the services and do not sell or share lead data with third parties."
  },
  {
    title: "3. How We Use Information",
    content:
      "We use collected information to operate, maintain, and improve the platform, provide support, send service-related communications, process payments, and ensure platform security."
  },
  {
    title: "4. Communication & Notifications",
    content:
      "We may contact you regarding account activity, billing, security updates, product changes, or support inquiries. Marketing communications can be opted out at any time."
  },
  {
    title: "5. Cookies & Tracking Technologies",
    content:
      "We use cookies and similar technologies to analyze usage patterns, improve performance, and personalize user experience. You can control cookie behavior through your browser settings."
  },
  {
    title: "6. Third-Party Services",
    content:
      "We may share limited data with trusted third-party providers such as hosting services, email delivery providers, WhatsApp APIs, analytics platforms, and payment processors strictly for service operation."
  },
  {
    title: "7. Data Security",
    content:
      "We implement industry-standard security practices including access controls, encryption, and monitoring. However, no system is completely secure, and we cannot guarantee absolute protection."
  },
  {
    title: "8. Data Retention",
    content:
      "We retain personal and business data only for as long as necessary to provide services or comply with legal obligations. Upon account termination, data may be deleted after a reasonable retention period."
  },
  {
    title: "9. User Rights",
    content:
      "You have the right to access, update, or delete your personal information. Requests can be made by contacting our support or privacy team."
  },
  {
    title: "10. International Data Transfers",
    content:
      "Your data may be processed or stored on servers located outside your country. We take reasonable steps to ensure appropriate data protection safeguards are in place."
  },
  {
    title: "11. Children’s Privacy",
    content:
      "LeadForGrow is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors."
  },
  {
    title: "12. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Updates will be reflected on this page, and continued use of the service indicates acceptance of the revised policy."
  },
  {
    title: "13. Contact Information",
    content:
      "If you have questions or concerns about this Privacy Policy, you may contact us at privacy@leadforgrow.com."
  }
];

  return (
    <MarketingLayout 
      title="Privacy Policy" 
      subtitle="Your data security and privacy are our top priorities. Learn how we handle your information."
      maxWidth="4xl"
    >
      <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-500 dark:text-slate-400 mb-12 italic">Last Updated: September 21, 2026</p>

          <div className="mb-12 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <Heading level={2} className="text-2xl mb-4">Who We Are</Heading>
            <p className="mb-4">
              {PRODUCT_STATEMENT} In this Privacy Policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {LEGAL_NAME}. We are the data controller for account and platform data; for customer data you process through LeadForGrow, we act as a data processor.
            </p>
            <CompanyAddress variant="full" />
          </div>
          
          {sections.map((section, idx) => (
            <div key={idx} className="mb-12 last:mb-0">
              <Heading level={2} className="text-2xl mb-4">{section.title}</Heading>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {section.content}
              </p>
            </div>
          ))}
          
          <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Questions about our privacy policy?</p>
            <a href="mailto:privacy@leadforgrow.com" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              privacy@leadforgrow.com
            </a>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
