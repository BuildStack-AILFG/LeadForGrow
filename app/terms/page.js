'use client';

import React from 'react';
import MarketingLayout from '@/app/components/MarketingLayout';
import Heading from '@/app/components/ui/Heading';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';

export default function TermsOfService() {
 const terms = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the LeadForGrow platform, including its products and services such as FollowUpSure, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree to these terms, you must not access or use the platform."
  },
  {
    title: "2. Description of Service",
    content:
      "LeadForGrow provides a follow-up and execution intelligence platform that includes lead capture, automation, task management, analytics, communication workflows, and related tools. Features may vary based on the subscription plan selected."
  },
  {
    title: "3. Account Registration & Responsibility",
    content:
      "To use the service, you must create an account and provide accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
  },
  {
    title: "4. Subscription Plans, Billing & Usage Limits",
    content:
      "Certain features are subject to usage limits such as number of leads, users, clients, automations, or integrations, depending on your subscription plan. Fees are billed in advance on a monthly or annual basis. We reserve the right to modify pricing or plan limits with reasonable prior notice."
  },
  {
    title: "5. Free Trials",
    content:
      "Free trial access may be offered at our discretion. At the end of the trial period, continued use of the service requires an active paid subscription. We reserve the right to limit or revoke trial access in cases of abuse."
  },
  {
  title: "6. Payments, Cancellation & No-Refund Policy",
  content:
    "All subscription fees, usage charges, setup fees, onboarding services, and add-ons are billed in advance and are strictly non-refundable. Once a payment is completed, no refunds, credits, or chargebacks will be issued under any circumstances. You may cancel your subscription at any time, but cancellation will only prevent future billing and will not result in a refund for the current billing period."
},

  {
    title: "7. Acceptable Use Policy",
    content:
      "You agree not to use the platform for unlawful activities, spamming, unsolicited messaging, data scraping, or any activity that violates applicable laws or third-party rights. We reserve the right to suspend or terminate accounts that violate this policy."
  },
  {
    title: "8. Customer Data & Ownership",
    content:
      "You retain full ownership of all data, leads, and content you submit to the platform. LeadForGrow acts solely as a data processor to provide the service and does not sell or claim ownership over your data."
  },
  {
    title: "9. Service Availability & Modifications",
    content:
      "We strive to maintain high availability but do not guarantee uninterrupted access. We may update, modify, or discontinue features at any time to improve performance, security, or compliance."
  },
  {
    title: "10. Third-Party Integrations",
    content:
      "The platform may integrate with third-party services such as WhatsApp, email providers, payment gateways, or analytics tools. LeadForGrow is not responsible for outages, data loss, or policy changes caused by third-party providers."
  },
  {
    title: "11. Intellectual Property",
    content:
      "All software, branding, trademarks, designs, and platform components are the exclusive property of LeadForGrow. You may not copy, reverse engineer, or resell any part of the service without written permission."
  },
  {
    title: "12. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, LeadForGrow shall not be liable for any indirect, incidental, special, or consequential damages, including loss of revenue, data, or business opportunities arising from your use of the service."
  },
  {
    title: "13. Indemnification",
    content:
      "You agree to indemnify and hold harmless LeadForGrow from any claims, damages, or expenses arising from your use of the platform, violation of these terms, or misuse of customer data."
  },
  {
    title: "14. Termination",
    content:
      "We reserve the right to suspend or terminate your account if you violate these terms, misuse the platform, or engage in prohibited activities. Upon termination, access to the service will be revoked."
  },
  {
    title: "15. Governing Law",
    content:
      "These Terms of Service shall be governed by and interpreted in accordance with the laws of India, without regard to conflict of law principles."
  },
  {
    title: "16. Changes to Terms",
    content:
      "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms."
  }
];


  return (
    <MarketingLayout 
      title="Terms of Service" 
      subtitle="Please read these terms carefully before using the LeadForGrow platform."
      maxWidth="4xl"
    >
      <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-500 dark:text-slate-400 mb-12 italic">Last Updated: September 21, 2026</p>

          <div className="mb-12 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 text-slate-600 dark:text-slate-300 leading-relaxed">
            <Heading level={2} className="text-2xl mb-4">Who These Terms Are With</Heading>
            <p className="mb-4">
              {PRODUCT_STATEMENT} These Terms of Service are an agreement between you and {LEGAL_NAME}. In these Terms, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {LEGAL_NAME}; &ldquo;LeadForGrow&rdquo; is the name of the platform and product we operate and is not a separate legal entity.
            </p>
            <CompanyAddress variant="full" />
          </div>
          
          {terms.map((term, idx) => (
            <div key={idx} className="mb-12 last:mb-0">
              <Heading level={2} className="text-2xl mb-4">{term.title}</Heading>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {term.content}
              </p>
            </div>
          ))}
          
          <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Need clarification on our terms?</p>
            <a href="mailto:legal@leadforgrow.online" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              legal@leadforgrow.online
            </a>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
