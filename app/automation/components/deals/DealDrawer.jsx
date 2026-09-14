'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  IndianRupee,
  Calendar,
  User,
  Activity,
  StickyNote,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { getStageLabel } from '@/lib/crm/pipelineUtils';
import DealStageBadge from './DealStageBadge';
import {
  initials,
  ownerName,
  formatValue,
  formatDate,
  formatRelative,
  companyOrContact,
  dealProbability,
} from './utils';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Briefcase },
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[12px]';
  return (
    <span className={`${sz} rounded-full bg-[#101828] text-white font-semibold inline-flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  );
}

export default function DealDrawer({ dealId, stages: pipelineStages = [], onClose, onUpdated, onStageChange }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  // Distinguishes a genuinely missing deal (404) from a transient load failure — both
  // used to collapse into one generic "Deal not found" shown identically across the
  // Overview/Timeline/Notes tabs, since they all gate on the same `deal` truthiness.
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  // Ignores a response for a deal the user has already navigated away from, so a slow
  // fetch for a PREVIOUS dealId can't overwrite the newly-opened deal's data.
  const latestDealIdRef = useRef(dealId);

  const loadDeal = () => {
    if (!dealId) return;
    latestDealIdRef.current = dealId;
    setLoading(true);
    setDeal(null);
    setError(null);
    authFetch(`/api/automation/deals/${dealId}`)
      .then((r) => r.json().then((data) => ({ status: r.status, data })))
      .then(({ status, data }) => {
        if (latestDealIdRef.current !== dealId) return;
        if (data.success) {
          setDeal(data.data);
        } else {
          setError(status === 404 ? 'not_found' : 'load_failed');
          toast.error('Failed to load deal');
        }
      })
      .catch(() => {
        if (latestDealIdRef.current === dealId) setError('load_failed');
        toast.error('Failed to load deal');
      })
      .finally(() => {
        if (latestDealIdRef.current === dealId) setLoading(false);
      });
  };

  useEffect(() => {
    setTab('overview');
    loadDeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  useEffect(() => {
    const refresh = () => {
      if (!dealId) return;
      authFetch(`/api/automation/deals/${dealId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setDeal(data.data);
        })
        .catch(() => {});
    };
    window.addEventListener('lfg-crm-refresh', refresh);
    return () => window.removeEventListener('lfg-crm-refresh', refresh);
  }, [dealId]);

  const stages = deal?.pipelineId?.stages?.length ? deal.pipelineId.stages : pipelineStages;
  const prob = deal ? dealProbability(deal, stages) : 0;

  const handleStageChange = async (newStage) => {
    if (!deal || newStage === deal.stage) return;
    if (onStageChange) {
      const updated = await onStageChange(deal._id, newStage);
      if (updated) setDeal(updated);
      return updated;
    }
  };

  return (
    <AnimatePresence>
      {dealId && (
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
              ) : deal ? (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={deal.title} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[17px] font-semibold text-[#101828] truncate">{deal.title}</h2>
                      <DealStageBadge stage={deal.stage} stages={stages} size="xs" />
                    </div>
                    <p className="text-[12px] text-[#667085]">
                      {formatValue(deal.amount, deal.currency)} · {prob}% probability
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-1 shrink-0">
                {deal && (
                  <Link
                    href={`/automation/deals/${deal._id}`}
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg whitespace-nowrap transition-colors ${tab === t.id ? 'bg-[#101828] text-white' : 'text-[#667085] hover:bg-[#F2F4F7]'
                    }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <DrawerSkeleton />
              ) : deal ? (
                <>
                  {tab === 'overview' && <OverviewTab deal={deal} stages={stages} prob={prob} onStageChange={handleStageChange} />}
                  {tab === 'timeline' && <TimelineTab timeline={deal.timeline || []} />}
                  {tab === 'notes' && <NotesTab notes={deal.notes || []} />}
                </>
              ) : error === 'not_found' ? (
                <p className="text-[13px] text-[#667085] text-center py-12">Deal not found</p>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[13px] text-[#667085] mb-3">Failed to load this deal.</p>
                  <button
                    type="button"
                    onClick={loadDeal}
                    className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#101828] hover:bg-[#1D2939] rounded"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function OverviewTab({ deal, stages, prob, onStageChange }) {
  const contact = companyOrContact(deal);

  const handleSelectChange = async (e) => {
    const newStage = e.target.value;
    if (newStage === deal.stage) return;
    const prev = deal.stage;
    const updated = await onStageChange?.(newStage);
    if (!updated) e.target.value = prev;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Amount', value: formatValue(deal.amount, deal.currency), icon: IndianRupee },
          { label: 'Probability', value: `${prob}%`, icon: Briefcase },
          { label: 'Close Date', value: formatDate(deal.wonAt || deal.expectedCloseDate), icon: Calendar },
          { label: 'Owner', value: ownerName(deal.assignedTo), icon: User },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#98A2B3]">{k.label}</p>
            <p className="text-[16px] font-semibold text-[#101828] mt-1 tabular-nums truncate">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#98A2B3]">Deal Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <div>
            <dt className="text-[#98A2B3] text-[11px] mb-0.5">Stage</dt>
            <dd className="flex items-center gap-2 flex-wrap">
              <select
                value={deal.stage}
                onChange={handleSelectChange}
                className="text-[12px] px-2 py-1 border border-[#E5E7EB] rounded-lg bg-white text-[#344054]"
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <DealStageBadge stage={deal.stage} stages={stages} />
            </dd>
          </div>
          <div>
            <dt className="text-[#98A2B3] text-[11px] mb-0.5">Company / Contact</dt>
            <dd className="flex items-center gap-1 text-[#344054]">
              <Building2 className="w-3.5 h-3.5" />{contact}
            </dd>
          </div>
          {deal.leadId?.email && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Lead Email</dt>
              <dd className="text-[#344054]">{deal.leadId.email}</dd>
            </div>
          )}
          {deal.companyId?.name && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Company</dt>
              <dd className="text-[#344054]">{deal.companyId.name}</dd>
            </div>
          )}
          {deal.source && (
            <div>
              <dt className="text-[#98A2B3] text-[11px] mb-0.5">Source</dt>
              <dd className="text-[#344054] capitalize">{deal.source}</dd>
            </div>
          )}
          <div>
            <dt className="text-[#98A2B3] text-[11px] mb-0.5">Stage Label</dt>
            <dd className="text-[#344054]">{getStageLabel(stages, deal.stage)}</dd>
          </div>
        </dl>

        <div className="pt-2">
          <p className="text-[11px] text-[#98A2B3] mb-1.5">Win probability</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-[#F2F4F7] overflow-hidden">
              <div className="h-full rounded-full bg-[#101828]" style={{ width: `${Math.min(100, prob)}%` }} />
            </div>
            <span className="text-[12px] tabular-nums text-[#667085]">{prob}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ timeline }) {
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
