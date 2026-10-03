'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  IndianRupee,
  Calendar,
  User,
  Activity,
  CheckSquare,
  StickyNote,
} from 'lucide-react';
import { getStageLabel, resolveStages } from '@/lib/crm/pipelineUtils';
import { useDealDetail } from '../../hooks/useDealDetail';
import LeadsSkeleton from '../leads/LeadsSkeleton';
import DemoScheduledModal from '../leads/DemoScheduledModal';
import QuotationSentModal from '../leads/QuotationSentModal';
import LostReasonModal from '../leads/LostReasonModal';

function formatCurrency(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`;
  }
}

function ownerLabel(owner) {
  if (!owner) return 'Unassigned';
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email || 'Unassigned';
}

export default function DealDetailWorkspace() {
  const { id } = useParams();
  const detail = useDealDetail(id);
  const { deal, loading, error, saving, changeStage, archiveDeal, fetchDeal } = detail;

  const handleStageChange = async (e) => {
    const newStage = e.target.value;
    if (!deal || newStage === deal.stage) return;
    const prev = deal.stage;
    const updated = await changeStage(newStage);
    if (!updated) e.target.value = prev;
  };

  if (loading) return <LeadsSkeleton />;
  if (!deal && error === 'not_found') {
    return <div className="p-8 text-center text-fg-tertiary">Deal not found</div>;
  }
  if (!deal) {
    return (
      <div className="p-8 text-center text-fg-tertiary">
        <p className="mb-3">Failed to load this deal.</p>
        <button
          type="button"
          onClick={fetchDeal}
          className="px-3 py-1.5 text-meta font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  const stages = resolveStages(deal.pipelineId?.stages);
  const stageLabel = getStageLabel(stages, deal.stage);
  const currency = deal.currency || 'INR';
  const quotations = (deal.customFields?.quotations) || (typeof deal.customFields?.get === 'function' ? deal.customFields.get('quotations') : null) || [];
  const payments = (deal.customFields?.payments) || (typeof deal.customFields?.get === 'function' ? deal.customFields.get('payments') : null) || [];

  return (
    <div className="min-h-full bg-canvas">
      <DemoScheduledModal
        open={!!detail.demoPrompt}
        entityName={detail.demoPrompt?.dealName}
        saving={detail.demoSaving}
        onCancel={detail.cancelDemoPrompt}
        onConfirm={detail.confirmDemoScheduled}
      />
      <QuotationSentModal
        open={!!detail.quotationPrompt}
        entityName={detail.quotationPrompt?.dealName}
        dealId={detail.quotationPrompt?.dealId}
        saving={detail.quotationSaving}
        onCancel={detail.cancelQuotationPrompt}
        onConfirm={detail.confirmQuotationSent}
      />
      <LostReasonModal
        open={!!detail.lostPrompt}
        entityName={detail.lostPrompt?.dealName}
        saving={detail.lostSaving}
        onCancel={detail.cancelLostPrompt}
        onConfirm={detail.confirmLostReason}
      />
      <div className="px-4 sm:px-6 py-5 max-w-[1400px] mx-auto">
        <Link href="/automation/deals" className="inline-flex items-center gap-1 text-sm text-fg-tertiary hover:text-accent-fg mb-4">
          <ArrowLeft className="w-4 h-4" /> Deals
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-canvas border border-line dark:bg-accent-pressed/30 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-fg-secondary" />
            </div>
            <div>
              <h1 className="text-page font-semibold text-fg">{deal.title}</h1>
              <p className="text-xl font-semibold text-accent-fg dark:text-accent-fg mt-1">{formatCurrency(deal.amount, currency)}</p>
              <p className="text-sm text-fg-tertiary mt-1">{stageLabel} · {deal.probability}% probability</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={deal.stage}
              disabled={saving || detail.demoSaving || detail.quotationSaving || detail.lostSaving}
              onChange={handleStageChange}
              className="px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900"
            >
              {stages.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <button onClick={archiveDeal} className="px-3 py-2 text-sm border border-line rounded-lg hover:bg-canvas">Archive</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-fg-tertiary mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><User className="w-4 h-4 text-fg-tertiary" /><span>{ownerLabel(deal.assignedTo)}</span></div>
                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-fg-tertiary" /><span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span></div>
                )}
                {deal.leadId && (
                  <div>Lead: <Link href={`/automation/leads/${deal.leadId._id || deal.leadId}`} className="text-accent-fg hover:underline">{deal.leadId.name || 'View'}</Link></div>
                )}
                {deal.contactId && (
                  <div>Contact: <Link href={`/automation/contacts/${deal.contactId._id || deal.contactId}`} className="text-accent-fg hover:underline">{deal.contactId.fullName || 'View'}</Link></div>
                )}
                {deal.companyId && (
                  <div>Company: <Link href={`/automation/companies/${deal.companyId._id || deal.companyId}`} className="text-accent-fg hover:underline">{deal.companyId.name || 'View'}</Link></div>
                )}
                {deal.lostReason && <div className="text-danger">Lost: {deal.lostReason}</div>}
              </dl>
            </div>

            {(quotations.length > 0 || payments.length > 0) && (
              <div className="bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-fg-tertiary mb-3">Records</h3>
                {quotations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-fg-tertiary mb-1">Quotations</p>
                    {quotations.map((q) => (
                      <p key={q.id} className="text-sm">{formatCurrency(q.amount, q.currency || currency)} · {q.status}</p>
                    ))}
                  </div>
                )}
                {payments.length > 0 && (
                  <div>
                    <p className="text-xs text-fg-tertiary mb-1">Payments</p>
                    {payments.map((p) => (
                      <p key={p.id} className="text-sm">{formatCurrency(p.amount, p.currency || currency)} · {p.status}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="xl:col-span-4 space-y-4">
            <div className="bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><CheckSquare className="w-4 h-4 text-accent-fg" /> Tasks ({deal.tasks?.length || 0})</h3>
              {(deal.tasks || []).length ? deal.tasks.map((t) => (
                <div key={t._id} className="text-sm py-2 border-b last:border-0 border-line dark:border-slate-800">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-fg-tertiary">{t.status} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</p>
                </div>
              )) : <p className="text-sm text-fg-tertiary">No tasks linked</p>}
            </div>
            <div className="bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><StickyNote className="w-4 h-4 text-accent-fg" /> Notes ({deal.notes?.length || 0})</h3>
              {(deal.notes || []).length ? deal.notes.map((n) => (
                <div key={n._id} className="text-sm py-2 border-b last:border-0 border-line dark:border-slate-800">
                  <p className="whitespace-pre-wrap">{n.content}</p>
                </div>
              )) : <p className="text-sm text-fg-tertiary">No notes yet</p>}
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="bg-canvas dark:bg-slate-900 border border-line/80 dark:border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-accent-fg" /> Activity Timeline</h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {(deal.timeline || []).map((a) => (
                  <div key={a._id} className="text-sm border-l-2 border-line pl-3 py-1">
                    <p>{a.description}</p>
                    <p className="text-xs text-fg-tertiary">{new Date(a.performedAt).toLocaleString()}</p>
                  </div>
                ))}
                {!deal.timeline?.length && <p className="text-sm text-fg-tertiary">No activity yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
