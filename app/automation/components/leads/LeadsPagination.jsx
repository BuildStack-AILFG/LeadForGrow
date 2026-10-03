'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LeadsPagination({ pagination, onPageChange }) {
  const { page, pages, total, limit } = pagination;
  if (pages <= 1) {
    return (
      <p className="text-xs text-fg-tertiary dark:text-fg-tertiary py-3">
        Showing {total} lead{total !== 1 ? 's' : ''}
      </p>
    );
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">
        {start}–{end} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded-lg border border-line dark:border-slate-700 disabled:opacity-40 hover:bg-subtle dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium px-2 tabular-nums text-fg-secondary dark:text-fg-tertiary">
          {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded-lg border border-line dark:border-slate-700 disabled:opacity-40 hover:bg-subtle dark:hover:bg-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
