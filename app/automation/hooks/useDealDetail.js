'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { resolveStages } from '@/lib/crm/pipelineUtils';
import { useDealStageModals } from './useDealStageModals';

export function useDealDetail(dealId) {
  const confirm = useConfirm();
  const router = useRouter();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Distinguishes "this deal genuinely doesn't exist" (404) from a transient failure
  // (network hiccup, 5xx) — previously both collapsed into the same generic
  // "Deal not found" fallback shown by every tab (Overview/Timeline/Notes) alike.
  const [error, setError] = useState(null);

  // Guards against an in-flight request for a PREVIOUS dealId resolving after the user
  // has already switched to a new one and overwriting that new deal's freshly-loaded data.
  const latestDealIdRef = useRef(dealId);

  const fetchDeal = useCallback(async () => {
    if (!dealId) return;
    try {
      const res = await authFetch(`/api/automation/deals/${dealId}`);
      const data = await res.json();
      if (latestDealIdRef.current !== dealId) return data; // stale response, ignore
      if (data.success) {
        setDeal(data.data);
        setError(null);
      } else {
        setError(res.status === 404 ? 'not_found' : (data.error || 'load_failed'));
      }
      return data;
    } catch {
      if (latestDealIdRef.current === dealId) setError('load_failed');
      return { success: false };
    }
  }, [dealId]);

  useEffect(() => {
    latestDealIdRef.current = dealId;
    // Reset stale state from a previously-open deal immediately — otherwise a failed
    // fetch for the newly-opened deal could leave the PREVIOUS deal's data on screen.
    setDeal(null);
    setError(null);
    setLoading(true);
    fetchDeal().finally(() => setLoading(false));
  }, [fetchDeal, dealId]);

  const stageModals = useDealStageModals({
    getStages: () => resolveStages(deal?.pipelineId?.stages),
    onUpdated: (updated) => setDeal(updated),
  });

  const updateDeal = async (payload) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/automation/deals/${dealId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDeal(data.data);
        toast.success('Deal updated');
        window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
        return true;
      }
      toast.error(data.error || 'Update failed');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeStage = useCallback(
    async (stage) => {
      return stageModals.requestDealStageChange(dealId, stage, { title: deal?.title });
    },
    [dealId, deal?.title, stageModals]
  );

  const archiveDeal = async () => {
    if (!(await confirm({ title: 'Archive deal', message: 'Archive this deal?', confirmLabel: 'Archive' }))) return;
    const ok = await updateDeal({ archived: true });
    if (ok) router.push('/automation/deals');
  };

  return {
    deal,
    loading,
    error,
    saving,
    fetchDeal,
    updateDeal,
    changeStage,
    archiveDeal,
    demoPrompt: stageModals.demoPrompt,
    demoSaving: stageModals.demoSaving,
    confirmDemoScheduled: stageModals.confirmDemoScheduled,
    cancelDemoPrompt: stageModals.cancelDemoPrompt,
    quotationPrompt: stageModals.quotationPrompt,
    quotationSaving: stageModals.quotationSaving,
    confirmQuotationSent: stageModals.confirmQuotationSent,
    cancelQuotationPrompt: stageModals.cancelQuotationPrompt,
    lostPrompt: stageModals.lostPrompt,
    lostSaving: stageModals.lostSaving,
    confirmLostReason: stageModals.confirmLostReason,
    cancelLostPrompt: stageModals.cancelLostPrompt,
  };
}
