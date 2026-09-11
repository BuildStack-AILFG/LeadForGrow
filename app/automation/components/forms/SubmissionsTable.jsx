'use client';

import { Search, Download, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SubmissionsTable({ submissions, loading, formName }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [submissions, search]);

  const exportCsv = () => {
    if (!filtered.length) return toast.error('No data to export');
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Received'];
    const rows = filtered.map((s) => [
      s.name, s.email || '', s.phone || '', s.status, new Date(s.receivedAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formName || 'form'}-submissions.csv`;
    a.click();
    toast.success('CSV exported');
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading submissions…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submissions…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <p className="text-sm text-slate-500">No submissions yet for this form</p>
          <p className="text-xs text-slate-400 mt-1">Leads from this form appear here automatically</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {s.phone || s.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.receivedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/automation/leads/${s._id}`} className="text-teal-600 hover:underline inline-flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
