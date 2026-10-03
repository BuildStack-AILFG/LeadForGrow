'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { authFetch, getUserId } from '@/lib/apiClient';

const inputCls = 'w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent';

function ConvertForm({ lead, teamMembers, form, setForm, pipelines, stages }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-800 text-sm">
        <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Lead</p>
        <p className="font-medium text-fg dark:text-white">{lead?.name || '—'}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Company</label>
        <input
          className={`${inputCls} mt-1`}
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          placeholder={lead?.companyId?.name || 'Company name (optional)'}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Deal Name *</label>
        <input
          className={`${inputCls} mt-1`}
          value={form.dealTitle}
          onChange={(e) => setForm({ ...form, dealTitle: e.target.value })}
          placeholder="Deal name"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Deal Amount</label>
        <input
          type="number"
          className={`${inputCls} mt-1`}
          value={form.dealAmount}
          onChange={(e) => setForm({ ...form, dealAmount: e.target.value })}
          placeholder="0"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Expected Close Date</label>
        <input
          type="date"
          className={`${inputCls} mt-1`}
          value={form.expectedCloseDate}
          onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Pipeline</label>
        <select
          className={`${inputCls} mt-1`}
          value={form.pipelineId}
          onChange={(e) => {
            const p = pipelines.find((x) => x._id === e.target.value);
            setForm({
              ...form,
              pipelineId: e.target.value,
              dealStage: p?.stages?.find((s) => s.key === 'discovery')?.key || p?.stages?.[0]?.key || 'discovery',
            });
          }}
        >
          {pipelines.map((p) => (
            <option key={p._id} value={p._id}>{p.name}{p.isDefault ? ' (Default)' : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Starting Stage</label>
        <select
          className={`${inputCls} mt-1`}
          value={form.dealStage}
          onChange={(e) => setForm({ ...form, dealStage: e.target.value })}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Owner *</label>
        <select
          className={`${inputCls} mt-1`}
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
        >
          <option value="">Select team member</option>
          {teamMembers.map((m) => (
            <option key={m._id} value={m._id}>
              {[m.firstName, m.lastName].filter(Boolean).join(' ') || m.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 pt-1 border-t border-line dark:border-slate-800">
        <label className="flex items-center gap-2 text-xs text-fg-secondary dark:text-fg-tertiary">
          <input type="checkbox" checked={form.createCompany} disabled className="rounded" />
          Create company if missing
        </label>
        <label className="flex items-center gap-2 text-xs text-fg-secondary dark:text-fg-tertiary">
          <input type="checkbox" checked={form.createContact} disabled className="rounded" />
          Create contact if missing
        </label>
        <label className="flex items-center gap-2 text-xs text-fg-secondary dark:text-fg-tertiary">
          <input
            type="checkbox"
            checked={form.archiveLead}
            onChange={(e) => setForm({ ...form, archiveLead: e.target.checked })}
            className="rounded"
          />
          Archive lead after conversion
        </label>
      </div>
    </div>
  );
}

export default function ConvertLeadDialog({
  open,
  lead,
  teamMembers = [],
  onClose,
  onConfirm,
  saving,
  variant = 'modal',
}) {
  const [pipelines, setPipelines] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    dealTitle: '',
    dealAmount: '',
    companyName: '',
    pipelineId: '',
    dealStage: 'discovery',
    expectedCloseDate: '',
    assignedTo: '',
    createCompany: true,
    createContact: true,
    archiveLead: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const meta = lead?.metadata;
    const budget = meta?.estimatedBudget ?? meta?.dealAmount ?? meta?.amount;
    authFetch('/api/automation/pipelines')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPipelines(d.data || []);
          const def = d.data?.find((p) => p.isDefault) || d.data?.[0];
          if (def) {
            setForm({
              dealTitle: lead?.name ? `Deal — ${lead.name}` : '',
              dealAmount: budget != null ? String(budget) : '',
              companyName: '',
              pipelineId: def._id,
              dealStage: def.stages?.find((s) => s.key === 'discovery')?.key || def.stages?.[0]?.key || 'discovery',
              expectedCloseDate: '',
              assignedTo: lead?.assignedTo?._id || lead?.assignedTo || getUserId() || '',
              createCompany: true,
              createContact: true,
              archiveLead: true,
            });
          }
        }
      });
  }, [open, lead]);

  const activePipeline = pipelines.find((p) => p._id === form.pipelineId);
  const stages = activePipeline?.stages || [];

  if (!open || !mounted) return null;

  const footer = (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-line dark:border-slate-700 rounded-lg">
        Cancel
      </button>
      <button
        type="button"
        disabled={saving || !form.dealTitle || !form.assignedTo}
        onClick={() => onConfirm(form)}
        className="px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
      >
        {saving ? 'Converting…' : 'Convert to Deal'}
      </button>
    </div>
  );

  if (variant === 'drawer') {
    return (
      <div className="absolute inset-0 z-40 bg-canvas dark:bg-slate-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-fg dark:text-white">Convert to Deal</h3>
            <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">Creates contact, company & deal — lead moves to Deals</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-md text-fg-tertiary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ConvertForm lead={lead} teamMembers={teamMembers} form={form} setForm={setForm} pipelines={pipelines} stages={stages} />
        </div>
        <div className="px-4 py-3 border-t border-line dark:border-slate-800 bg-subtle dark:bg-slate-900/80">
          {footer}
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-canvas dark:bg-slate-900 rounded-lg shadow-modal w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-line dark:border-slate-800">
          <h3 className="font-semibold text-fg dark:text-white">Convert to Deal</h3>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1">
            This lead will be marked converted and removed from your active leads list.
          </p>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <ConvertForm lead={lead} teamMembers={teamMembers} form={form} setForm={setForm} pipelines={pipelines} stages={stages} />
        </div>
        <div className="px-5 py-4 border-t border-line dark:border-slate-800">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}
