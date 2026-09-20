'use client';

import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

// Case-insensitive header matching, same technique as the existing leads bulk-upload
// page (app/automation/leads/bulk/page.js) — lets a CSV exported from any CRM/sheet
// work without the user having to rename columns first.
function findValue(row, keys) {
  const foundKey = Object.keys(row).find((k) =>
    keys.some((key) => k.toLowerCase().trim() === key.toLowerCase())
  );
  return foundKey ? String(row[foundKey] ?? '').trim() : '';
}

function resolveStageKey(raw, stages) {
  if (!raw) return undefined;
  const norm = raw.toLowerCase().trim();
  const match = stages.find(
    (s) => s.key.toLowerCase() === norm || s.label.toLowerCase() === norm
  );
  return match?.key;
}

export default function DealsImportModal({ open, onClose, stages = [], pipelineId, onImported }) {
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | ready | processing | done
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const [logs, setLogs] = useState([]);

  if (!open) return null;

  const reset = () => {
    setRows([]);
    setStatus('idle');
    setIndex(0);
    setResults({ success: 0, failed: 0 });
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        if (!result.data?.length) {
          toast.error('The CSV appears to be empty');
          return;
        }
        setRows(result.data);
        setStatus('ready');
        setResults({ success: 0, failed: 0 });
        setLogs([]);
        setIndex(0);
      },
      error: (err) => toast.error(`Failed to read CSV: ${err.message}`),
    });
    e.target.value = '';
  };

  const importRow = async (row) => {
    const title = findValue(row, ['title', 'deal', 'deal name', 'name']);
    if (!title) return { ok: false, label: '(missing title)', error: 'Title is required' };

    const amountRaw = findValue(row, ['amount', 'value', 'deal value']);
    const stageRaw = findValue(row, ['stage', 'status']);
    const payload = {
      title,
      amount: amountRaw ? parseFloat(amountRaw.replace(/[^0-9.]/g, '')) || 0 : 0,
      currency: findValue(row, ['currency']) || 'INR',
      stage: resolveStageKey(stageRaw, stages),
      expectedCloseDate: findValue(row, ['close date', 'expected close date', 'closedate']) || undefined,
      source: findValue(row, ['source']) || 'import',
      pipelineId,
    };

    try {
      const res = await authFetch('/api/automation/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) return { ok: true, label: title };
      return { ok: false, label: title, error: data.error || 'Failed' };
    } catch (err) {
      return { ok: false, label: title, error: err.message || 'Network error' };
    }
  };

  const startImport = async () => {
    setStatus('processing');
    let success = 0;
    let failed = 0;
    for (let i = 0; i < rows.length; i += 1) {
      setIndex(i + 1);
      // eslint-disable-next-line no-await-in-loop
      const result = await importRow(rows[i]);
      if (result.ok) {
        success += 1;
        setLogs((prev) => [`✅ [${i + 1}/${rows.length}] ${result.label}`, ...prev]);
      } else {
        failed += 1;
        setLogs((prev) => [`❌ [${i + 1}/${rows.length}] ${result.label} — ${result.error}`, ...prev]);
      }
      setResults({ success, failed });
    }
    setStatus('done');
    onImported?.();
    toast.success(`Imported ${success} of ${rows.length} deal${rows.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={status === 'processing' ? undefined : handleClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-slate-700 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7] dark:border-slate-700">
          <h3 className="text-[15px] font-semibold text-[#101828] dark:text-slate-100">Import Deals from CSV</h3>
          {status !== 'processing' && (
            <button type="button" onClick={handleClose} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-[13px] text-[#667085] dark:text-slate-300">
                Upload a CSV with a <span className="font-medium">Title</span> column (required), plus any of
                Amount, Currency, Stage, Close Date, Source. Column names are matched automatically, case-insensitive.
              </p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} id="deals-csv-input" />
              <label
                htmlFor="deals-csv-input"
                className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-[#E5E7EB] dark:border-slate-700 rounded-xl cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-slate-800 transition-colors"
              >
                <Upload className="w-6 h-6 text-[#98A2B3] dark:text-slate-400" />
                <span className="text-[13px] font-medium text-[#344054] dark:text-slate-200">Choose CSV file</span>
              </label>
            </>
          )}

          {status === 'ready' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-brand-tint border border-brand-tint-strong rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-brand-ink shrink-0" />
                <span className="text-[13px] text-brand-ink font-medium">{rows.length} row{rows.length === 1 ? '' : 's'} ready to import</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startImport}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-brand hover:bg-brand-hover rounded"
                >
                  Start Import
                </button>
                <button type="button" onClick={reset} className="px-4 py-2.5 text-[13px] font-medium text-[#475467] dark:text-slate-300 border border-[#E5E7EB] dark:border-slate-700 rounded hover:bg-[#F9FAFB] dark:hover:bg-slate-800">
                  Choose different file
                </button>
              </div>
            </>
          )}

          {(status === 'processing' || status === 'done') && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F9FAFB] dark:bg-slate-900 rounded-lg border border-[#E5E7EB] dark:border-slate-700">
                  <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 font-medium">Progress</p>
                  <p className="text-lg font-semibold text-[#101828] dark:text-slate-100 tabular-nums">{index}/{rows.length}</p>
                </div>
                <div className="p-3 bg-brand-tint rounded-lg border border-brand-tint-strong">
                  <p className="text-[11px] text-brand-ink font-medium">Success</p>
                  <p className="text-lg font-semibold text-brand-ink tabular-nums">{results.success}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Failed</p>
                  <p className="text-lg font-semibold text-red-700 dark:text-red-300 tabular-nums">{results.failed}</p>
                </div>
              </div>

              {status === 'processing' && (
                <div className="flex items-center gap-2 text-[12px] text-[#667085] dark:text-slate-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…
                </div>
              )}

              <div className="bg-[#F9FAFB] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg p-3 max-h-52 overflow-y-auto font-mono text-[11px] space-y-1">
                {logs.length === 0 ? (
                  <p className="text-slate-400 italic">Starting…</p>
                ) : (
                  logs.map((log, i) => <div key={i} className="text-[#344054] dark:text-slate-200">{log}</div>)
                )}
              </div>

              {status === 'done' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white bg-brand hover:bg-brand-hover rounded"
                >
                  <CheckCircle2 className="w-4 h-4" /> Done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
