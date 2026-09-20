'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from './constants';

export default function CompaniesPagination({ pagination, onPageChange, onLimitChange }) {
  const { page, pages, total, limit } = pagination;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t border-[#E5E7EB] dark:border-slate-700 mt-4">
      <div className="flex items-center gap-3">
        <p className="text-[12px] text-[#667085] dark:text-slate-300">
          {total === 0 ? 'No companies' : `${start}–${end} of ${total.toLocaleString()} companies`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">Rows per page</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-[12px] px-2 py-1.5 border border-[#E5E7EB] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-[#344054] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#101828]/10"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium border border-[#E5E7EB] dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 text-[#344054] dark:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-[12px] font-medium px-3 tabular-nums text-[#667085] dark:text-slate-300">
          {page} / {Math.max(pages, 1)}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium border border-[#E5E7EB] dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 text-[#344054] dark:text-slate-200 transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
