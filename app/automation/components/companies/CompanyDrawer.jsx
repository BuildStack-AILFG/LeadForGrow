'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  Activity,
  Paperclip,
  StickyNote,
  ExternalLink,
  UserPlus,
  Plus,
  MapPin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { stageLabel } from '@/lib/crm/pipelineStages';
import CompanyStatusBadge from './CompanyStatusBadge';
import {
  initials,
  ownerName,
  formatCurrency,
  formatRelative,
  formatWebsite,
  companyLogoUrl,
} from './utils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

function Avatar({ name, src, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[12px]';
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-[#E5E7EB] dark:border-slate-700`} />;
  return (
    <span className={`${sz} rounded-full bg-[#F2F4F7] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300 font-semibold inline-flex items-center justify-center`}>
      {initials(name)}
    </span>
  );
}

export default function CompanyDrawer({ companyId, onClose, onUpdated }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setTab('overview');
    authFetch(`/api/automation/companies/${companyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCompany(data.data);
        else toast.error('Failed to load company');
      })
      .catch(() => toast.error('Failed to load company'))
      .finally(() => setLoading(false));
  }, [companyId]);

  const logo = company ? companyLogoUrl(company) : null;

  return (
    <AnimatePresence>
      {companyId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#101828]/30 dark:bg-slate-700 backdrop-blur-[1px] z-[60]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[720px] bg-white dark:bg-slate-900 border-l border-[#E5E7EB] dark:border-slate-700 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#E5E7EB] dark:border-slate-700 shrink-0">
              {loading ? (
                <div className="h-12 w-48 bg-[#F2F4F7] dark:bg-slate-900 rounded-lg animate-pulse" />
              ) : company ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? <img src={logo} alt="" className="w-6 h-6 object-contain" /> : <Building2 className="w-5 h-5 text-[#667085] dark:text-slate-300" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[17px] font-semibold text-[#101828] dark:text-slate-100 truncate">{company.name}</h2>
                      <CompanyStatusBadge status={company.status || 'prospect'} />
                    </div>
                    <p className="text-[12px] text-[#667085] dark:text-slate-300">{company.industry || 'No industry'} · {ownerName(company.ownerId)}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-1 shrink-0">
                {company && (
                  <Link
                    href={`/automation/companies/${company._id}`}
                    className="p-2 rounded-lg text-[#667085] dark:text-slate-300 hover:bg-[#F2F4F7] dark:hover:bg-slate-800 hover:text-[#344054] dark:hover:text-slate-200"
                    title="Open full page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#667085] dark:text-slate-300 hover:bg-[#F2F4F7] dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-2 border-b border-[#E5E7EB] dark:border-slate-700 overflow-x-auto shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                    tab === t.id ? 'bg-[#101828] dark:bg-slate-700 text-white' : 'text-[#667085] dark:text-slate-300 hover:bg-[#F2F4F7] dark:hover:bg-slate-800'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <DrawerSkeleton />
              ) : company ? (
                <>
                  {tab === 'overview' && <OverviewTab company={company} />}
                  {tab === 'contacts' && <ContactsTab contacts={company.contacts || []} />}
                  {tab === 'deals' && <DealsTab deals={company.deals || []} currency={company.summary?.currency} />}
                  {tab === 'activities' && <ActivitiesTab timeline={company.timeline || []} />}
                  {tab === 'files' && <FilesTab attachments={company.attachments || []} />}
                  {tab === 'notes' && <NotesTab notes={company.notes || []} />}
                </>
              ) : (
                <p className="text-[13px] text-[#667085] dark:text-slate-300 text-center py-12">Company not found</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function OverviewTab({ company }) {
  const summary = company.summary || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Deals', value: summary.openDeals ?? 0 },
          { label: 'Contacts', value: summary.activeContacts ?? 0 },
          { label: 'Pipeline', value: formatCurrency(summary.totalRevenue, summary.currency) },
          { label: 'Won Revenue', value: formatCurrency(summary.wonRevenue, summary.currency) },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-[#FAFBFC] dark:bg-slate-900">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#98A2B3] dark:text-slate-400">{k.label}</p>
            <p className="text-[18px] font-semibold text-[#101828] dark:text-slate-100 mt-1 tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 space-y-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#98A2B3] dark:text-slate-400">Company Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          {company.website && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Website</dt>
              <dd className="flex items-center gap-1 text-[#344054] dark:text-slate-200"><Globe className="w-3.5 h-3.5" />{formatWebsite(company.website)}</dd>
            </div>
          )}
          {company.email && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Email</dt>
              <dd className="flex items-center gap-1 text-[#344054] dark:text-slate-200"><Mail className="w-3.5 h-3.5" />{company.email}</dd>
            </div>
          )}
          {company.phone && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Phone</dt>
              <dd className="flex items-center gap-1 text-[#344054] dark:text-slate-200"><Phone className="w-3.5 h-3.5" />{company.phone}</dd>
            </div>
          )}
          {company.employeeCount && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Employees</dt>
              <dd className="text-[#344054] dark:text-slate-200">{company.employeeCount}</dd>
            </div>
          )}
          {company.annualRevenue != null && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Revenue</dt>
              <dd className="text-[#344054] dark:text-slate-200">{formatCurrency(company.annualRevenue, company.revenueCurrency)}</dd>
            </div>
          )}
          {company.gstNumber && (
            <div>
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">GST Number</dt>
              <dd className="text-[#344054] dark:text-slate-200">{company.gstNumber}</dd>
            </div>
          )}
          {company.address?.city && (
            <div className="sm:col-span-2">
              <dt className="text-[#98A2B3] dark:text-slate-400 text-[11px] mb-0.5">Address</dt>
              <dd className="flex items-start gap-1 text-[#344054] dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {[company.address.street, company.address.city, company.address.state, company.address.country].filter(Boolean).join(', ')}
              </dd>
            </div>
          )}
        </dl>
        {company.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {company.tags.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F2F4F7] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300">{t}</span>
            ))}
          </div>
        )}
        {company.description && (
          <p className="text-[13px] text-[#475467] dark:text-slate-300 leading-relaxed pt-2 border-t border-[#F2F4F7] dark:border-slate-700">{company.description}</p>
        )}
      </div>
    </div>
  );
}

function ContactsTab({ contacts }) {
  if (!contacts.length) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-[#D0D5DD] mx-auto mb-3" />
        <p className="text-[13px] text-[#667085] dark:text-slate-300">No contacts linked yet</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {contacts.map((c) => {
        const name = c.fullName || [c.firstName, c.lastName].filter(Boolean).join(' ');
        const email = c.emails?.[0]?.address;
        const phone = c.phones?.[0]?.number;
        const isDM = /ceo|cto|founder|director|vp|head/i.test(c.jobTitle || '');
        return (
          <div key={c._id} className="p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#D0D5DD] dark:hover:border-slate-700 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <Avatar name={name} src={c.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100">{name}</p>
                  {isDM && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">Decision Maker</span>
                  )}
                </div>
                {c.jobTitle && <p className="text-[11px] text-[#667085] dark:text-slate-300 mt-0.5">{c.jobTitle}</p>}
                {phone && <p className="text-[12px] text-[#475467] dark:text-slate-300 mt-2">{phone}</p>}
                {email && <p className="text-[12px] text-[#667085] dark:text-slate-300 truncate">{email}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DealsTab({ deals, currency = 'INR' }) {
  if (!deals.length) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-10 h-10 text-[#D0D5DD] mx-auto mb-3" />
        <p className="text-[13px] text-[#667085] dark:text-slate-300">No deals yet</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
          <tr>
            {['Deal', 'Stage', 'Amount', 'Close Date', 'Probability'].map((h) => (
              <th key={h} className="py-2.5 px-3 font-semibold text-[#667085] dark:text-slate-300 uppercase tracking-wide text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d._id} className="border-b border-[#F2F4F7] dark:border-slate-700 hover:bg-[#FAFBFC] dark:hover:bg-slate-800">
              <td className="py-3 px-3 font-medium text-[#101828] dark:text-slate-100">{d.title}</td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-md bg-[#F2F4F7] dark:bg-slate-900 text-[#475467] dark:text-slate-300 text-[11px] font-medium">{stageLabel(d.stage)}</span>
              </td>
              <td className="py-3 px-3 tabular-nums text-[#101828] dark:text-slate-100">{formatCurrency(d.amount, d.currency || currency)}</td>
              <td className="py-3 px-3 text-[#667085] dark:text-slate-300">{d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
              <td className="py-3 px-3 tabular-nums text-[#667085] dark:text-slate-300">{d.probability ?? '—'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivitiesTab({ timeline }) {
  if (!timeline.length) {
    return <p className="text-[13px] text-[#667085] dark:text-slate-300 text-center py-12">No activity yet</p>;
  }
  return (
    <div className="space-y-0">
      {timeline.map((item, i) => (
        <div key={item._id || i} className="flex gap-3 pb-4 relative">
          {i < timeline.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E5E7EB] dark:bg-slate-800" />}
          <div className="w-3.5 h-3.5 rounded-full bg-[#101828] dark:bg-slate-700 border-2 border-white dark:border-slate-700 shrink-0 mt-1 z-10" />
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[13px] text-[#344054] dark:text-slate-200">{item.description}</p>
            <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 mt-0.5">{formatRelative(item.performedAt || item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesTab({ attachments }) {
  if (!attachments.length) {
    return <p className="text-[13px] text-[#667085] dark:text-slate-300 text-center py-12">No files uploaded</p>;
  }
  return (
    <div className="space-y-2">
      {attachments.map((f) => (
        <a
          key={f._id}
          href={f.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:bg-[#FAFBFC] dark:hover:bg-slate-800 transition-colors"
        >
          <Paperclip className="w-4 h-4 text-[#667085] dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#101828] dark:text-slate-100 truncate">{f.fileName || f.name}</p>
            <p className="text-[11px] text-[#98A2B3] dark:text-slate-400">{formatRelative(f.createdAt)}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function NotesTab({ notes }) {
  if (!notes.length) {
    return <p className="text-[13px] text-[#667085] dark:text-slate-300 text-center py-12">No notes yet</p>;
  }
  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div key={n._id} className={`p-4 rounded-xl border ${n.pinned ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50' : 'border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
          {n.pinned && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Pinned</span>}
          <p className="text-[13px] text-[#344054] dark:text-slate-200 mt-1 whitespace-pre-wrap">{n.content || n.text}</p>
          <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 mt-2">{formatRelative(n.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-[#F2F4F7] dark:bg-slate-900" />)}
      </div>
      <div className="h-48 rounded-xl bg-[#F2F4F7] dark:bg-slate-900" />
    </div>
  );
}
