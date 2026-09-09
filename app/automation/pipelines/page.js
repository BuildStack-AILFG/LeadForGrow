'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import LeadsSkeleton from '../components/leads/LeadsSkeleton';
import { GripVertical, Save, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { normalizePipelineStages, slugifyStageKey } from '@/lib/crm/pipelineUtils';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';

function PipelinesContent() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/api/automation/pipelines');
      const data = await res.json();
      if (data.success) {
        setPipelines(data.data || []);
        const def = data.data?.find((p) => p.isDefault) || data.data?.[0];
        if (def) {
          setSelectedId((prev) => prev || def._id);
          if (!selectedId || selectedId === def._id) {
            setStages(normalizePipelineStages(def.stages || []));
          }
        }
      } else {
        setLoadError(data.error || 'Failed to load pipelines');
      }
    } catch {
      setLoadError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const active = pipelines.find((p) => p._id === selectedId);

  useEffect(() => {
    if (active) setStages(normalizePipelineStages(active.stages || []));
  }, [active?._id]);

  const updateStage = (index, patch) => {
    setStages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.label && !patch.key) {
        next[index].key = next[index].key || slugifyStageKey(patch.label);
      }
      return next;
    });
  };

  const moveStage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    setStages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const addStage = () => {
    const label = `New Stage ${stages.length + 1}`;
    setStages((prev) => [
      ...prev,
      {
        key: slugifyStageKey(label),
        label,
        order: prev.length,
        color: '#6366f1',
        probability: 50,
        isWon: false,
        isLost: false,
      },
    ]);
  };

  const removeStage = (index) => {
    if (stages.length <= 1) {
      toast.error('Pipeline must have at least one stage');
      return;
    }
    setStages((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const saveStages = async () => {
    if (!selectedId) return;
    const normalized = normalizePipelineStages(stages);
    if (!normalized.length) {
      toast.error('Add at least one stage');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`/api/automation/pipelines/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify({ stages: normalized }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pipeline saved');
        fetchPipelines();
        window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
      } else toast.error(data.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LeadsSkeleton />;

  if (loadError) {
    return (
      <div className="min-h-full bg-[#FAFDFA] dark:bg-slate-950 px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">{loadError}</p>
          <button
            type="button"
            onClick={fetchPipelines}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FAFDFA] dark:bg-slate-950 px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Deal Pipeline</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Customize stage names, win probability scores, and colors. Changes appear instantly across Kanban, deals table, and deal detail.
      </p>

      <AutoPageIntro />

      {pipelines.length > 1 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mb-4 px-3 py-2 text-sm border rounded-lg dark:bg-slate-900 dark:border-slate-700"
        >
          {pipelines.map((p) => <option key={p._id} value={p._id}>{p.name}{p.isDefault ? ' (Default)' : ''}</option>)}
        </select>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <span className="text-sm font-semibold">{active?.name || 'Sales Pipeline'}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addStage}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-white"
            >
              <Plus className="w-3.5 h-3.5" /> Add stage
            </button>
            <button
              type="button"
              onClick={saveStages}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 grid grid-cols-[auto_1fr_72px_56px_auto_auto] gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <span className="w-4" />
          <span>Stage name</span>
          <span className="text-center">Score %</span>
          <span>Color</span>
          <span>Won</span>
          <span />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {stages.map((s, i) => (
            <div key={s.key || i} className="grid grid-cols-[auto_1fr_72px_56px_auto_auto] gap-3 items-center px-4 py-3">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <div className="min-w-0">
                <input
                  value={s.label}
                  onChange={(e) => updateStage(i, { label: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800"
                  placeholder="Stage name"
                />
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.key}</p>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={s.probability}
                onChange={(e) => updateStage(i, { probability: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 text-center"
                title="Win probability %"
              />
              <input
                type="color"
                value={s.color || '#6366f1'}
                onChange={(e) => updateStage(i, { color: e.target.value })}
                className="w-10 h-9 rounded border border-slate-200 cursor-pointer"
              />
              <div className="flex flex-col gap-1 text-[10px]">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(s.isWon)}
                    onChange={(e) => updateStage(i, { isWon: e.target.checked, isLost: e.target.checked ? false : s.isLost })}
                  />
                  Won
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(s.isLost)}
                    onChange={(e) => updateStage(i, { isLost: e.target.checked, isWon: e.target.checked ? false : s.isWon })}
                  />
                  Lost
                </label>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => moveStage(i, -1)} className="p-1 text-slate-400 hover:text-slate-600" title="Move up">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveStage(i, 1)} className="p-1 text-slate-400 hover:text-slate-600" title="Move down">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeStage(i)} className="p-1 text-red-400 hover:text-red-600" title="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PipelinesPage() {
  return <Suspense fallback={<LeadsSkeleton />}><PipelinesContent /></Suspense>;
}
