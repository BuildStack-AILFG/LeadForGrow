import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { PRODUCT_STATEMENT } from '@/lib/company';

export default function LegalPageLayout({ title, lastUpdated, children, variant = 'default', showCompanyInfo = true }) {
  const isDark = variant === 'dark';

  return (
    <MarketingShell>
      <section className={`${MARKETING.sectionTight} ${isDark ? 'bg-[#064E3B] text-white' : 'border-b border-emerald-100'}`}>
        <div className={`${MARKETING.containerNarrow}`}>
          <p className={`${MARKETING.overline} ${isDark ? 'text-emerald-300' : ''}`}>Legal</p>
          <h1 className={`${MARKETING.h1} mt-2 mb-2 ${isDark ? 'text-white' : ''}`}>{title}</h1>
          {lastUpdated && <p className={`text-sm ${isDark ? 'text-emerald-200/70' : 'text-[#94A3B8]'}`}>Last updated: {lastUpdated}</p>}
        </div>
      </section>
      <article className={`${MARKETING.sectionTight} prose prose-slate max-w-none`}>
        <div className={`${MARKETING.containerNarrow} space-y-6 text-[#374151] leading-relaxed`}>
          {children}
          {showCompanyInfo && (
            <div className="pt-6 border-t border-emerald-100 text-sm text-[#64748B]">
              <p className="mb-3">{PRODUCT_STATEMENT}</p>
              <CompanyAddress variant="full" />
            </div>
          )}
          <div className="pt-8 border-t border-emerald-100 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-emerald-700 hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-emerald-700 hover:underline">Terms of Service</Link>
            <Link href="/contact" className="text-emerald-700 hover:underline">Contact</Link>
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#111827] mb-3 font-[family-name:var(--font-plus-jakarta)]">{title}</h2>
      <div className="text-[15px] text-[#64748B] space-y-3">{children}</div>
    </section>
  );
}
