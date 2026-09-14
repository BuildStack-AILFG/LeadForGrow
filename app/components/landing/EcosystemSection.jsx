import {
  BookOpen,
  Code2,
  LayoutGrid,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

const PRODUCTS = [
  {
    id: 'crm',
    name: 'LeadForGrow CRM',
    description: 'AI-powered CRM for lead management and automation.',
    icon: LayoutGrid,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    id: 'hrm',
    name: 'LeadForGrow HRM',
    description: 'Employee management, attendance, payroll, and performance.',
    icon: Users,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    id: 'lms',
    name: 'LeadForGrow LMS',
    description: 'Create courses and manage learning programs at scale.',
    icon: BookOpen,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'tavvr',
    name: 'LeadForGrow Tavvr',
    description: 'Restaurant OS for ordering, kitchen ops, and analytics.',
    icon: UtensilsCrossed,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
  {
    id: 'scaledesk',
    name: 'ScaleDesk Technology',
    description: 'Custom software, AI automation, and enterprise consulting.',
    icon: Code2,
    iconColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
  },
];

function ProductCard({ product }) {
  const Icon = product.icon;

  return (
    <div className="flex h-full min-w-[220px] flex-col rounded-2xl border border-[#B8B8B8] bg-white p-6 lg:min-w-0">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${product.iconBg}`}>
        <Icon className={`h-5 w-5 ${product.iconColor}`} strokeWidth={1.75} />
      </div>

      <h3 className="mt-5 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#111827]">
        {product.name}
      </h3>

      <p className="mt-2 text-[13.5px] leading-[1.6] text-[#6B7280]">
        {product.description}
      </p>
    </div>
  );
}

export default function EcosystemSection() {
  return (
    <section id="ecosystem" className="overflow-hidden bg-white pt-12 pb-4 sm:pt-14 sm:pb-5">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9CA3AF]">
            Our Ecosystem
          </p>
          <h2
            className="mt-2 text-[1.625rem] font-semibold leading-[1.2] tracking-[-0.03em] text-[#111827] sm:text-[1.75rem]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            The LeadForGrow Ecosystem.
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            One intelligent platform powering CRM, HR, learning, restaurants, and custom software.
          </p>
        </div>

        <div className="mt-9 hidden grid-cols-5 gap-4 lg:grid">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="-mx-6 mt-9 flex gap-4 overflow-x-auto px-6 pb-2 lg:hidden">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="w-[min(240px,78vw)] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
