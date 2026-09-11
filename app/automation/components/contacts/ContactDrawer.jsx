'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Activity,
  StickyNote,
  ExternalLink,
  Building2,
  MapPin,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { stageLabel } from '@/lib/crm/pipelineStages';
import ContactTypeBadge from './ContactTypeBadge';
import {
  initials,
  ownerName,
  formatCurrency,
  formatRelative,
  contactName,
} from './utils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

function Avatar({ name, src, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[12px]';
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-[#E5E7EB]`} />;
  return (
    <span className={`${sz} rounded-full bg-[#F2F4F7] border border-[#E5E7EB] text-[#475467] font-semibold inline-flex items-center justify-center`}>
      {initials(name)}
    </span>
  );
}

function primaryEmail(contact) {
  return contact?.emails?.find((e) => e.primary)?.address || contact?.emails?.[0]?.address || '';
}

function primaryPhone(contact) {
  return contact?.phones?.find((p) => p.primary)?.number || contact?.phones?.[0]?.number || '';
}

export default function ContactDrawer({ contactId, onClose, onUpdated }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!contactId) return;
    setLoading(true);
    setTab('overview');
    authFetch(`/api/automation/contacts/${contactId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setContact(data.data);
        else toast.error('Failed to load contact');
      })
      .catch(() => toast.error('Failed to load contact'))
      .finally(() => setLoading(false));
  }, [contactId]);

  const name = contact ? contactName(contact) : '';

  return (
    <AnimatePresence>
      {contactId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#101828]/30 backdrop-blur-[1px] z-[60]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[720px] bg-white border-l border-[#E5E7EB] shadow-2xl z-[70] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#E5E7EB] shrink-0">
              {loading ? (
                <div className="h-12 w-48 bg-[#F2F4F7] rounded-lg animate-pulse" />
              ) : contact ? (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={name} src={contact.avatar} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[17px] font-semibold text-[#101828] truncate">{name}</h2>
                      <ContactTypeBadge type={contact.type || 'personal'} size="xs" />
                    </div>
                    <p className="text-[12px] text-[#667085]">
                      {contact.jobTitle || 'No title'} · {ownerName(contact.ownerId)}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-1 shrink-0">
                {contact && (
                  <Link
                    href={`/automation/contacts/${contact._id}`}
                    className="p-2 rounded-lg text-[#667085] hover:bg-[#F2F4F7] hover:text-[#344054]"
                    title="Open full page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#667085] hover:bg-[#F2F4F7]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 px-5 py-2 border-b border-[#E5E7EB] overflow-x-auto shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                    tab === t.id ? 'bg-[#101828] text-white' : 'text-[#667085] hover:bg-[#F2F4F7]'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <DrawerSkeleton />
              ) : contact ? (
                <>
                  {tab === 'overview' && <OverviewTab contact={contact} />}
                  {tab === 'deals' && <DealsTab deals={contact.deals || []} />}
                  {tab === 'activities' && <ActivitiesTab timeline={contact.timeline || []} />}
                  {tab === 'notes' && <NotesTab notes={contact.notes || []} />}
                </>
              ) : (
                <p className="text-[13px] text-[#667085] text-center py-12">Contact not found</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function OverviewTab({ contact }) {
  const email = primaryEmail(contact);
  const phone = primaryPhone(contact);
  const company = contact.companyId;
  const openDeals = (contact.deals || []).filter((d) => !['won', 'lost'].includes(d.stage)).length;
  const pipelineValue = (contact.deals || [])
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const currency = contact.deals?.[0]?.currency || 'INR';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Deals', value: openDeals },
          { label: 'Total Deals', value: (contact.deals || []).length },
          { label: 'Pipeline', value: formatCurrency(pipelineValue, currency) },
          { label: 'Pending Tasks', value: (contact.tasks || []).filter((t) => t.status === 'pending').length },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#98A2B3]">{k.label}</p>
            <p className="text-[18px] font-semibold text-[#101828] mt-1 tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#98A2B3]">Contact Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          {email && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Email</dt>
              <dd className="flex items-center gap-1 text-[#344054]"><Mail className="w-3.5 h-3.5" />{email}</dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Phone</dt>
              <dd className="flex items-center gap-1 text-[#344054]"><Phone className="w-3.5 h-3.5" />{phone}</dd>
            </div>
          )}
          {contact.jobTitle && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Job Title</dt>
              <dd className="text-[#344054]">{contact.jobTitle}</dd>
            </div>
          )}
          {contact.department && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Department</dt>
              <dd className="text-[#344054]">{contact.department}</dd>
            </div>
          )}
          {company?.name && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Company</dt>
              <dd className="flex items-center gap-1 text-[#344054]">
                <Building2 className="w-3.5 h-3.5" />
                <Link href={`/automation/companies/${company._id || company}`} className="text-[#059669] hover:underline">
                  {company.name}
                </Link>
              </dd>
            </div>
          )}
          {contact.addresses?.[0]?.city && (
            <div className="sm:col-span-2">
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Address</dt>
              <dd className="flex items-start gap-1 text-[#344054]">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {[contact.addresses[0].street, contact.addresses[0].city, contact.addresses[0].state, contact.addresses[0].country].filter(Boolean).join(', ')}
              </dd>
            </div>
          )}
        </dl>
        {contact.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {contact.tags.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F2F4F7] border border-[#E5E7EB] text-[#475467]">{t}</span>
            ))}
          </div>
        )}
        {contact.notes && typeof contact.notes === 'string' && (
          <p className="text-[13px] text-[#475467] leading-relaxed pt-2 border-t border-[#F2F4F7]">{contact.notes}</p>
        )}
      </div>
    </div>
  );
}

function DealsTab({ deals }) {
  if (!deals.length) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-10 h-10 text-[#D0D5DD] mx-auto mb-3" />
        <p className="text-[13px] text-[#667085]">No deals yet</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <table className="w-full text-left text-[12px]">
        <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <tr>
            {['Deal', 'Stage', 'Amount', 'Close Date', 'Probability'].map((h) => (
              <th key={h} className="py-2.5 px-3 font-semibold text-[#667085] uppercase tracking-wide text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d._id} className="border-b border-[#F2F4F7] hover:bg-[#FAFBFC]">
              <td className="py-3 px-3 font-medium text-[#101828]">{d.title}</td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-md bg-[#F2F4F7] text-[#475467] text-[11px] font-medium">{stageLabel(d.stage)}</span>
              </td>
              <td className="py-3 px-3 tabular-nums text-[#101828]">{formatCurrency(d.amount, d.currency)}</td>
              <td className="py-3 px-3 text-[#667085]">{d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
              <td className="py-3 px-3 tabular-nums text-[#667085]">{d.probability ?? '—'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivitiesTab({ timeline }) {
  if (!timeline.length) {
    return <p className="text-[13px] text-[#667085] text-center py-12">No activity yet</p>;
  }
  return (
    <div className="space-y-0">
      {timeline.map((item, i) => (
        <div key={item._id || i} className="flex gap-3 pb-4 relative">
          {i < timeline.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E5E7EB]" />}
          <div className="w-3.5 h-3.5 rounded-full bg-[#101828] border-2 border-white shrink-0 mt-1 z-10" />
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[13px] text-[#344054]">{item.description}</p>
            <p className="text-[11px] text-[#98A2B3] mt-0.5">{formatRelative(item.performedAt || item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesTab({ notes }) {
  if (!notes.length) {
    return <p className="text-[13px] text-[#667085] text-center py-12">No notes yet</p>;
  }
  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div key={n._id} className={`p-4 rounded-xl border ${n.pinned ? 'border-amber-200 bg-amber-50/50' : 'border-[#E5E7EB] bg-white'}`}>
          {n.pinned && <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Pinned</span>}
          <p className="text-[13px] text-[#344054] mt-1 whitespace-pre-wrap">{n.content || n.text}</p>
          <p className="text-[11px] text-[#98A2B3] mt-2">{formatRelative(n.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-[#F2F4F7]" />)}
      </div>
      <div className="h-48 rounded-xl bg-[#F2F4F7]" />
    </div>
  );
}
