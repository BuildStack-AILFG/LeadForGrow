'use client';

import { useCallback, useEffect, useState } from 'react';
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

  const fetchDeal = useCallback(async () => {
    if (!dealId) return;
    const res = await authFetch(`/api/automation/deals/${dealId}`);
    const data = await res.json();
    if (data.success) setDeal(data.data);
    return data;
  }, [dealId]);

  useEffect(() => {
    setLoading(true);
    fetchDeal().finally(() => setLoading(false));
  }, [fetchDeal]);

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
