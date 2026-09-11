'use client';

import { useState, useEffect } from 'react';
import {
  Plus, RefreshCw, Search, Edit, Trash2, ChevronLeft, ChevronRight, Download, Crown, Users, FileText, Snowflake, Sun
} from 'lucide-react';
import { getColumnsForModel, formatCellValue, planBadgeClass, PLAN_QUOTAS, PLAN_LABELS } from '../constants';

export default function AdminModelView({
  modelName, data, loading, error, search, pagination,
  onSearch, onRefresh, onCreate, onEdit, onDelete, onToggleFreeze, onPageChange,
}) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => { setLocalSearch(search); }, [search]);

  const columns = getColumnsForModel(modelName, data);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {modelName}
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              {pagination.total} records
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Direct database access · use with care</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={handleExport} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors" title="Export JSON">
            <Download className="w-4 h-4" />
          </button>
          <button type="button" onClick={onRefresh} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" /> New record
          </button>
        </div>
      </div>

      {/* Business plan helper */}
      {modelName === 'Business' && <BusinessPlanGuide />}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(localSearch)}
          placeholder={`Search ${modelName}…`}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data.length ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400">
                    No records found{search ? ` for "${search}"` : ''}.
                  </td>
                </tr>
              ) : (
                data.map((doc, i) => (
                  <tr key={doc._id || i} className="hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors group">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {col === 'plan' && doc[col] ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold capitalize border ${planBadgeClass(doc[col], 'light')}`}>
                            {doc[col]}
                          </span>
                        ) : col === 'frozen' ? (
                          doc[col] ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
                              <Snowflake className="w-3 h-3" /> Frozen
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )
                        ) : col === 'enabled' ? (
                          <span className={`text-xs font-semibold ${doc[col] ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {doc[col] ? 'ON' : 'OFF'}
                          </span>
                        ) : (
                          formatCellValue(doc[col], col)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {modelName === 'Business' && onToggleFreeze && (
                        <button
                          type="button"
                          onClick={() => onToggleFreeze(doc)}
                          title={doc.frozen ? 'Unfreeze — restore access' : 'Freeze — disable /automation immediately'}
                          className={`p-1.5 rounded-lg inline-flex mr-1 ${
                            doc.frozen
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                          }`}
                        >
                          {doc.frozen ? <Sun className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
                        </button>
                      )}
                      <button type="button" onClick={() => onEdit(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 inline-flex">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(doc._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 inline-flex ml-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessPlanGuide() {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 p-5 rounded-2xl bg-teal-50 dark:from-teal-950/30 dark:to-indigo-950/20 border border-teal-100 dark:border-teal-900/40">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Plan & quota defaults</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Changing <code className="bg-white dark:bg-slate-800 px-1 rounded">plan</code> auto-applies quotas. Override manually in Raw Data if needed.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['trial', 'growth', 'pro', 'premium'].map((p) => (
            <div key={p} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">{PLAN_LABELS[p]}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> {PLAN_QUOTAS[p].maxTeamMembers} users
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {PLAN_QUOTAS[p].maxForms} forms
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Access rules</p>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <li>• Paid plans get full feature access</li>
          <li>• Only <strong>free</strong> is feature-gated</li>
          <li>• Limits via quotas, not flags</li>
        </ul>
      </div>
    </div>
  );
}
