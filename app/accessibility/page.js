import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Accessibility',
  description: 'Accessibility statement for LeadForGrow: the standard we aim for, what we have done, known limitations and how to report a barrier.',
  alternates: { canonical: 'https://www.leadforgrow.com/accessibility' },
};

const DONE = [
  ['Keyboard focus', 'Visible focus outlines across the app, and keyboard navigation in menus, dialogs and the page search.'],
  ['Colour contrast', 'Text colours in light and dark mode were measured against WCAG contrast ratios and corrected where they fell short.'],
  ['Reduced motion', 'When your device asks for reduced motion, animations are switched off.'],
  ['Small screens', 'Every app page was checked at phone width so that nothing is cut off or unreachable.'],
  ['Labels', 'Icon-only buttons carry text labels for screen readers.'],
];

const LIMITS = [
  'The visual workflow builders (sequences and WhatsApp Flows) rely on drag-and-drop; some actions are not yet possible from the keyboard alone.',
  'Charts on the dashboard and in reports do not yet offer a text alternative for every value.',
  'Emails and templates you design are only as accessible as their content — add alt text to the images you upload.',
];

export default function AccessibilityPage() {
  const H2 = `${SITE.serif} text-[1.6rem]`;
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-10`}>
        <div className={SITE.narrow}>
          <p className={SITE.label}>Accessibility statement</p>
          <h1 className={`${SITE.serifXL} mt-6`}>LeadForGrow should work for everyone on your team.</h1>
        </div>
      </header>

      <article className={`${SITE.narrow} pb-24`}>
        {/* Status panel */}
        <dl className="grid border-y-2 border-[#0B1712] sm:grid-cols-3">
          {[['Standard', 'WCAG 2.1, level AA'], ['Status', 'Partially meets the standard'], ['Last reviewed', 'October 2026']].map(([k, v]) => (
            <div key={k} className={`border-b ${SITE.rule} py-4 last:border-0 sm:border-b-0 sm:pr-4`}>
              <dt className={SITE.label}>{k}</dt>
              <dd className="mt-1 font-medium text-[#0B1712]">{v}</dd>
            </div>
          ))}
        </dl>

        <p className={`${SITE.prose} mt-10 text-[18px]`}>
          We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA. We are not there everywhere yet, so this statement says
          what we’ve done, what we know is missing, and how to tell us about a problem.
        </p>

        <h2 className={`${H2} mt-14`}>What we’ve done</h2>
        <dl className="mt-5">
          {DONE.map(([k, v]) => (
            <div key={k} className={`grid gap-1 border-t ${SITE.rule} py-4 sm:grid-cols-[180px_1fr]`}>
              <dt className="font-semibold text-[#0B1712]">{k}</dt>
              <dd className={SITE.body}>{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className={`${H2} mt-14`}>Known limitations</h2>
        <ul className={`${SITE.prose} mt-5 list-disc space-y-3 pl-5`}>
          {LIMITS.map((l) => <li key={l}>{l}</li>)}
        </ul>

        <h2 className={`${H2} mt-14`}>Feedback and contact</h2>
        <p className={`${SITE.prose} mt-4`}>
          If you find a barrier, tell us the page, what you were trying to do and the assistive technology you use. We aim to reply within 5
          business days.
        </p>
        <p className="mt-6 border-l-2 border-[#1D4B3E] pl-5 text-[15px] text-[#0B1712]">
          Email <a href="mailto:accessibility@leadforgrow.com" className={SITE.link}>accessibility@leadforgrow.com</a>, or use the{' '}
          <Link href="/contact" className={SITE.link}>contact form</Link>.
        </p>
      </article>
    </MarketingShell>
  );
}
