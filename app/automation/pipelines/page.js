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
      <div className="min-h-full bg-subtle dark:bg-slate-950 px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="bg-danger-subtle dark:bg-red-950/30 border border-danger/30 dark:border-red-900 rounded-lg p-6 text-center">
          <p className="text-sm font-medium text-danger dark:text-red-300 mb-3">{loadError}</p>
          <button
            type="button"
            onClick={fetchPipelines}
            className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-red-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-subtle dark:bg-slate-950 px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-page font-semibold text-fg">Deal Pipeline</h1>
      <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mt-1 mb-6">
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

      <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-line dark:border-slate-800 bg-subtle dark:bg-slate-800/30 flex items-center justify-between">
          <span className="text-sm font-semibold">{active?.name || 'Sales Pipeline'}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addStage}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-fg-secondary dark:text-slate-200 border border-line dark:border-slate-700 rounded-lg hover:bg-canvas dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add stage
            </button>
            <button
              type="button"
              onClick={saveStages}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-line dark:border-slate-800 hidden sm:grid grid-cols-[auto_1fr_72px_56px_auto_auto] gap-3 text-meta font-semibold text-fg-tertiary">
          <span className="w-4" />
          <span>Stage name</span>
          <span className="text-center">Score %</span>
          <span>Color</span>
          <span>Won / Lost</span>
          <span />
        </div>

        <div className="divide-y divide-line dark:divide-slate-800">
          {stages.map((s, i) => (
            <div key={s.key || i} className="flex flex-wrap sm:grid sm:grid-cols-[auto_1fr_72px_56px_auto_auto] gap-3 items-center px-4 py-3">
              <GripVertical className="w-4 h-4 text-fg-disabled flex-shrink-0" />
              {/* Phones: the name gets its own line; the rest wraps below. */}
              <div className="min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto">
                <input
                  value={s.label}
                  onChange={(e) => updateStage(i, { label: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-line dark:border-slate-700 rounded dark:bg-slate-800"
                  placeholder="Stage name"
                />
                <p className="text-meta text-fg-tertiary mt-0.5 truncate">{s.key}</p>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={s.probability}
                onChange={(e) => updateStage(i, { probability: Number(e.target.value) })}
                className="w-20 sm:w-full px-2 py-1.5 text-sm border border-line dark:border-slate-700 rounded dark:bg-slate-800 text-center"
                title="Win probability %"
                aria-label="Win probability %"
              />
              <input
                type="color"
                value={s.color || '#6366f1'}
                onChange={(e) => updateStage(i, { color: e.target.value })}
                className="w-10 h-9 rounded border border-line dark:border-slate-700 cursor-pointer"
              />
              <div className="flex sm:flex-col gap-2 sm:gap-1 text-meta">
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
              <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
                <button type="button" onClick={() => moveStage(i, -1)} className="p-1 text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled" title="Move up">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveStage(i, 1)} className="p-1 text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled" title="Move down">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeStage(i)} className="p-1 text-red-400 hover:text-danger dark:hover:text-red-400" title="Remove">
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
