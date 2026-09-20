'use client';

import { getNodeDef } from '@/lib/sequences/constants';

export default function NodeSettingsPanel({ node, onUpdate }) {
  if (!node) {
    return (
      <aside className="w-72 shrink-0 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Select a node</p>
        <p className="text-xs text-slate-400 mt-1">Configure settings in this panel</p>
      </aside>
    );
  }

  const def = getNodeDef(node.type);
  const data = node.data || {};

  const set = (patch) => onUpdate(node.id, { data: { ...data, ...patch } });

  return (
    <aside className="w-72 shrink-0 flex flex-col rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden max-h-[calc(100vh-200px)]">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Node settings</p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{def.label}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Display label</label>
          <input
            value={data.label || ''}
            onChange={(e) => set({ label: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
          />
        </div>

        {(node.type === 'send_whatsapp' || node.type === 'ai_whatsapp_reply') && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Message</label>
              <textarea
                rows={4}
                value={data.message || ''}
                onChange={(e) => set({ message: e.target.value })}
                placeholder="Hi {{name}}, …"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs"
              />
            </div>
            {node.type === 'ai_whatsapp_reply' && (
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">AI tone</label>
                <select value={data.tone || 'friendly'} onChange={(e) => set({ tone: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual (Hinglish)</option>
                </select>
              </div>
            )}
          </>
        )}

        {node.type === 'send_instagram_dm' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Instagram message</label>
              <textarea
                rows={4}
                value={data.message || ''}
                onChange={(e) => set({ message: e.target.value })}
                placeholder="Hi {{name}}, …"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Media URL (optional)</label>
              <input
                value={data.mediaUrl || ''}
                onChange={(e) => set({ mediaUrl: e.target.value })}
                placeholder="https://…"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </>
        )}

        {node.type === 'wait_reply' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Wait days</label>
              <input type="number" min={0} value={data.waitDays ?? 0} onChange={(e) => set({ waitDays: +e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Wait hours</label>
              <input type="number" min={0} value={data.waitHours ?? 48} onChange={(e) => set({ waitHours: +e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
          </div>
        )}

        {(node.type === 'loop' || node.type === 'for_each') && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Max iterations</label>
            <input type="number" min={1} value={data.maxIterations ?? 10} onChange={(e) => set({ maxIterations: +e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
        )}

        {node.type === 'goto' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Target node ID</label>
            <input value={data.targetNodeId || ''} onChange={(e) => set({ targetNodeId: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs" />
          </div>
        )}

        {node.type === 'sub_workflow' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sub-workflow sequence ID</label>
            <input value={data.sequenceId || ''} onChange={(e) => set({ sequenceId: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs" />
          </div>
        )}

        {node.type === 'approval' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Approver role</label>
            <select value={data.approverRole || 'manager'} onChange={(e) => set({ approverRole: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        {node.type === 'send_email' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Subject</label>
              <input value={data.subject || ''} onChange={(e) => set({ subject: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Body</label>
              <textarea rows={5} value={data.body || ''} onChange={(e) => set({ body: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs" />
            </div>
          </>
        )}

        {node.type === 'delay' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Hours</label>
              <input type="number" min={0} value={data.delayHours ?? 0} onChange={(e) => set({ delayHours: +e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Minutes</label>
              <input type="number" min={0} value={data.delayMinutes ?? 0} onChange={(e) => set({ delayMinutes: +e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
          </div>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Field</label>
              <select value={data.field || 'status'} onChange={(e) => set({ field: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                <option value="status">Lead status</option>
                <option value="score">Lead score</option>
                <option value="tags">Tags</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Operator</label>
              <select value={data.operator || 'equals'} onChange={(e) => set({ operator: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="gte">Greater or equal</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Value</label>
              <input value={data.value || ''} onChange={(e) => set({ value: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
            </div>
          </>
        )}

        {node.type === 'add_tag' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tag name</label>
            <input value={data.tag || ''} onChange={(e) => set({ tag: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
        )}

        {node.type === 'move_pipeline' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Pipeline stage</label>
            <select value={data.stage || 'contacted'} onChange={(e) => set({ stage: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        )}

        {node.type === 'webhook' && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Webhook URL</label>
            <input value={data.url || ''} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
          </div>
        )}

        <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Variables: {'{{name}}'}, {'{{phone}}'}, {'{{email}}'}, {'{{serviceInterest}}'}
        </p>
      </div>
    </aside>
  );
}
