'use client';

import { Download, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { exportReportsCSV, exportReportsExcel } from './utils';

export default function ExportControls({ reports, metrics }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
            <button
              type="button"
              onClick={() => { exportReportsCSV(reports, metrics); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => { exportReportsExcel(reports); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Download Excel
            </button>
            <button
              type="button"
              onClick={() => { window.print(); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Print / PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
