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
      <div className="relative w-full max-w-lg bg-canvas rounded-lg shadow-modal border border-line max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-body font-semibold text-fg">Import Deals from CSV</h3>
          {status !== 'processing' && (
            <button type="button" onClick={handleClose} className="p-1.5 rounded text-fg-tertiary hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-dense text-fg-tertiary">
                Upload a CSV with a <span className="font-medium">Title</span> column (required), plus any of
                Amount, Currency, Stage, Close Date, Source. Column names are matched automatically, case-insensitive.
              </p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} id="deals-csv-input" />
              <label
                htmlFor="deals-csv-input"
                className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-line rounded-lg cursor-pointer hover:bg-subtle transition-colors"
              >
                <Upload className="w-6 h-6 text-fg-tertiary" />
                <span className="text-dense font-medium text-fg-secondary">Choose CSV file</span>
              </label>
            </>
          )}

          {status === 'ready' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-accent-subtle border border-line rounded-lg">
                <FileSpreadsheet className="w-4 h-4 text-accent-fg shrink-0" />
                <span className="text-dense text-accent-fg font-medium">{rows.length} row{rows.length === 1 ? '' : 's'} ready to import</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startImport}
                  className="flex-1 py-2.5 text-dense font-semibold text-white bg-accent hover:bg-accent-hover rounded"
                >
                  Start Import
                </button>
                <button type="button" onClick={reset} className="px-4 py-2.5 text-dense font-medium text-fg-secondary border border-line rounded-md hover:bg-subtle">
                  Choose different file
                </button>
              </div>
            </>
          )}

          {(status === 'processing' || status === 'done') && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-subtle rounded-lg border border-line">
                  <p className="text-meta text-fg-tertiary font-medium">Progress</p>
                  <p className="text-lg font-semibold text-fg tabular-nums">{index}/{rows.length}</p>
                </div>
                <div className="p-3 bg-accent-subtle rounded-lg border border-line">
                  <p className="text-meta text-accent-fg font-medium">Success</p>
                  <p className="text-lg font-semibold text-accent-fg tabular-nums">{results.success}</p>
                </div>
                <div className="p-3 bg-danger-subtle rounded-lg border border-danger/30">
                  <p className="text-meta text-danger font-medium">Failed</p>
                  <p className="text-lg font-semibold text-danger tabular-nums">{results.failed}</p>
                </div>
              </div>

              {status === 'processing' && (
                <div className="flex items-center gap-2 text-meta text-fg-tertiary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…
                </div>
              )}

              <div className="bg-subtle border border-line rounded-lg p-3 max-h-52 overflow-y-auto font-mono text-meta space-y-1">
                {logs.length === 0 ? (
                  <p className="text-fg-tertiary italic">Starting…</p>
                ) : (
                  logs.map((log, i) => <div key={i} className="text-fg-secondary">{log}</div>)
                )}
              </div>

              {status === 'done' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-dense font-semibold text-white bg-accent hover:bg-accent-hover rounded"
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
