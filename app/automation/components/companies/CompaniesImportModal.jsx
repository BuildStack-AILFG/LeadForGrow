'use client';

import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

// Case-insensitive header matching, same technique as the Deals CSV importer
// (app/automation/components/deals/DealsImportModal.jsx) — lets a CSV exported
// from any CRM/sheet work without the user having to rename columns first.
function findValue(row, keys) {
  const foundKey = Object.keys(row).find((k) =>
    keys.some((key) => k.toLowerCase().trim() === key.toLowerCase())
  );
  return foundKey ? String(row[foundKey] ?? '').trim() : '';
}

export default function CompaniesImportModal({ open, onClose, onImported }) {
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
    const name = findValue(row, ['name', 'company', 'company name']);
    if (!name) return { ok: false, label: '(missing name)', error: 'Name is required' };

    const payload = {
      name,
      industry: findValue(row, ['industry']) || undefined,
      website: findValue(row, ['website', 'domain']) || undefined,
      email: findValue(row, ['email']) || undefined,
      phone: findValue(row, ['phone']) || undefined,
      employeeCount: findValue(row, ['employee count', 'employees', 'size']) || undefined,
      status: findValue(row, ['status']) || undefined,
      gstNumber: findValue(row, ['gst', 'gst number', 'gstnumber']) || undefined,
      description: findValue(row, ['description']) || undefined,
    };

    try {
      const res = await authFetch('/api/automation/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) return { ok: true, label: name };
      return { ok: false, label: name, error: data.error || 'Failed' };
    } catch (err) {
      return { ok: false, label: name, error: err.message || 'Network error' };
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
    toast.success(`Imported ${success} of ${rows.length} compan${rows.length === 1 ? 'y' : 'ies'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={status === 'processing' ? undefined : handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded shadow-xl border border-[#E5E7EB] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7]">
          <h3 className="text-[15px] font-semibold text-[#101828]">Import Companies from CSV</h3>
          {status !== 'processing' && (
            <button type="button" onClick={handleClose} className="p-1.5 rounded text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-[13px] text-[#667085]">
                Upload a CSV with a <span className="font-medium">Name</span> column (required), plus any of
                Industry, Website, Email, Phone, Employee Count, Status, GST Number, Description. Column names are
                matched automatically, case-insensitive.
              </p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} id="companies-csv-input" />
              <label
                htmlFor="companies-csv-input"
                className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-[#E5E7EB] rounded cursor-pointer hover:bg-[#F9FAFB] transition-colors"
              >
                <Upload className="w-6 h-6 text-[#98A2B3]" />
                <span className="text-[13px] font-medium text-[#344054]">Choose CSV file</span>
              </label>
            </>
          )}

          {status === 'ready' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-[#F0F9F5] border border-[#BAE0CF] rounded">
                <FileSpreadsheet className="w-4 h-4 text-[#1D4B3E] shrink-0" />
                <span className="text-[13px] text-[#1D4B3E] font-medium">{rows.length} row{rows.length === 1 ? '' : 's'} ready to import</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startImport}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32] rounded"
                >
                  Start Import
                </button>
                <button type="button" onClick={reset} className="px-4 py-2.5 text-[13px] font-medium text-[#475467] border border-[#E5E7EB] rounded hover:bg-[#F9FAFB]">
                  Choose different file
                </button>
              </div>
            </>
          )}

          {(status === 'processing' || status === 'done') && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                  <p className="text-[11px] text-[#98A2B3] font-medium">Progress</p>
                  <p className="text-lg font-semibold text-[#101828] tabular-nums">{index}/{rows.length}</p>
                </div>
                <div className="p-3 bg-[#F0F9F5] rounded border border-[#BAE0CF]">
                  <p className="text-[11px] text-[#1D4B3E] font-medium">Success</p>
                  <p className="text-lg font-semibold text-[#1D4B3E] tabular-nums">{results.success}</p>
                </div>
                <div className="p-3 bg-red-50 rounded border border-red-100">
                  <p className="text-[11px] text-red-600 font-medium">Failed</p>
                  <p className="text-lg font-semibold text-red-700 tabular-nums">{results.failed}</p>
                </div>
              </div>

              {status === 'processing' && (
                <div className="flex items-center gap-2 text-[12px] text-[#667085]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing…
                </div>
              )}

              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3 max-h-52 overflow-y-auto font-mono text-[11px] space-y-1">
                {logs.length === 0 ? (
                  <p className="text-slate-400 italic">Starting…</p>
                ) : (
                  logs.map((log, i) => <div key={i} className="text-[#344054]">{log}</div>)
                )}
              </div>

              {status === 'done' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32] rounded"
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
