'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  Briefcase,
  IndianRupee,
  Globe,
  Clock,
  User,
} from 'lucide-react';

function ownerLabel(owner) {
  if (!owner) return 'Unassigned';
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email || 'Unassigned';
}

function formatCurrency(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CompanyCard({ company }) {
  const stats = company.stats || {};
  const currency = stats.currency || company.revenueCurrency || 'INR';

  return (
    <Link
      href={`/automation/companies/${company._id}`}
      className="group block bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-5 hover:border-line hover:shadow-popover transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-canvas border border-line dark:bg-emerald-950/40 border border-line dark:border-emerald-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-fg-secondary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-fg dark:text-white truncate group-hover:text-accent-fg dark:group-hover:text-accent-fg">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-xs text-fg-tertiary mt-0.5">{company.industry}</p>
            )}
          </div>
        </div>
      </div>

      {company.website && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-accent-fg truncate">
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-lg bg-subtle dark:bg-slate-800/50 px-2.5 py-2">
          <div className="flex items-center gap-1 text-meta text-fg-tertiary">
            <Users className="w-3 h-3" /> Contacts
          </div>
          <p className="text-sm font-semibold text-fg dark:text-slate-200 mt-0.5">
            {stats.contactCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-subtle dark:bg-slate-800/50 px-2.5 py-2">
          <div className="flex items-center gap-1 text-meta text-fg-tertiary">
            <Briefcase className="w-3 h-3" /> Deals
          </div>
          <p className="text-sm font-semibold text-fg dark:text-slate-200 mt-0.5">
            {stats.dealCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-accent-subtle dark:bg-emerald-950/20 px-2.5 py-2 col-span-2">
          <div className="flex items-center gap-1 text-meta text-accent-fg/80">
            <IndianRupee className="w-3 h-3" /> Total Revenue
          </div>
          <p className="text-sm font-semibold text-accent-fg dark:text-accent-fg mt-0.5">
            {formatCurrency(stats.totalRevenue, currency)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-line dark:border-slate-800 text-xs text-fg-tertiary">
        <div className="flex items-center gap-1 truncate">
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{ownerLabel(company.ownerId)}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(stats.lastActivity)}
        </div>
      </div>
    </Link>
  );
}
