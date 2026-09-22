'use client';

import Link from 'next/link';
import { Shield, Lock, Server, Eye, FileCheck, AlertTriangle } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';

const SECTIONS = [
  { icon: Lock, title: 'Encryption', desc: 'Data in transit is protected with TLS. Sensitive credentials are encrypted at rest with AES-256.' },
  { icon: Server, title: 'Infrastructure', desc: 'Hosted on managed cloud infrastructure.' },
  { icon: Shield, title: 'Authentication', desc: 'Password hashing with bcrypt and session tokens with expiry.' },
  { icon: Eye, title: 'Access control', desc: 'Role-based permissions, multi-tenant isolation, and audit logging for team actions.' },
  { icon: FileCheck, title: 'Compliance', desc: 'A Data Processing Agreement is available, and we aim to handle personal data responsibly under applicable data protection laws.' },
  { icon: AlertTriangle, title: 'Responsible disclosure', desc: 'Report vulnerabilities to security@leadforgrow.com. We aim to respond within 72 hours.' },
];

export default function SecurityPage() {
  return (
    <MarketingShell>
      <section className={`${MARKETING.section} bg-[#064E3B] text-white`}>
        <div className={`${MARKETING.container} max-w-3xl`}>
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest">Security</p>
          <h1 className="text-4xl lg:text-5xl font-bold mt-4 mb-6 font-[family-name:var(--font-plus-jakarta)]">Your data deserves careful protection.</h1>
          <p className="text-emerald-100/80 text-lg leading-relaxed">We treat security as a product feature — not an afterthought. Here&apos;s how we protect your business and customer data.</p>
        </div>
      </section>

      <section className={MARKETING.section}>
        <div className={`${MARKETING.container} grid sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
          {SECTIONS.map((s) => (
            <div key={s.title} className={`${MARKETING.card} p-7`}>
              <s.icon className="w-8 h-8 text-emerald-600 mb-4" />
              <h2 className={MARKETING.h3}>{s.title}</h2>
              <p className={`${MARKETING.body} mt-3 text-sm`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${MARKETING.sectionTight} bg-emerald-50/50`}>
        <div className={`${MARKETING.containerNarrow} text-center`}>
          <h2 className={MARKETING.h2}>Security questions?</h2>
          <p className={`${MARKETING.body} mt-3 mb-6`}>Contact our team with any security questions, or read our Data Processing Agreement.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className={MARKETING.btnPrimary}>Contact security team</Link>
            <Link href="/dpa" className={MARKETING.btnOutline}>View DPA</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
