'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import PageLoader from '../PageLoader';
import ConfirmDialog from '../shared/ConfirmDialog';

export default function ApprovalQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // execution id or null

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/approvals');
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (executionId, action, comment = '') => {
    setActing(executionId);
    try {
      const res = await authFetch('/api/automation/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, action, comment }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(action === 'approve' ? 'Approved — workflow resumed' : 'Rejected');
      setRejectTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <PageLoader label="Loading approval queue…" height="40vh" />
    );
  }

  if (!items.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No pending approvals.</p>;
  }

  return (
    <div className="p-4 space-y-3 max-w-3xl">
      {items.map((ex) => (
        <div key={ex._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {ex.sequenceId?.name || 'Workflow'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Lead: {ex.leadId?.name || ex.leadId?.phone || ex.leadId?._id}
              </p>
              <p className="text-xs text-slate-400 mt-1">{ex.pendingApproval?.reason || 'Approval required'}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={acting === ex._id}
                onClick={() => act(ex._id, 'approve')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                type="button"
                disabled={acting === ex._id}
                onClick={() => setRejectTarget(ex._id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!rejectTarget}
        mode="textarea"
        title="Reject this step?"
        message="Rejection reason — optional, visible in execution logs."
        placeholder="Why is this being rejected?"
        confirmLabel="Reject"
        danger
        saving={acting === rejectTarget}
        onConfirm={(comment) => act(rejectTarget, 'reject', comment)}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
