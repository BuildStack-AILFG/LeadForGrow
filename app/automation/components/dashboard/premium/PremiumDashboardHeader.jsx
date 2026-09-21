'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Bell,
  Share2,
  ChevronDown,
  LayoutGrid,
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useBusinessAssistant } from '../../../context/BusinessAssistantContext';
import GroviaIcon from '../../assistant/GroviaIcon';
import { DASHBOARD_WIDGETS } from '../../../hooks/useDashboardWidgets';

export default function PremiumDashboardHeader({
  refreshing,
  onRefresh,
  searchQuery,
  onSearchChange,
  lastUpdated,
  visibleWidgets,
  onToggleWidget,
}) {
  const router = useRouter();
  const { open: openAssistant } = useBusinessAssistant();
  const [exporting, setExporting] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const customizeRef = useRef(null);

  useEffect(() => {
    if (!customizeOpen) return;
    const onDown = (e) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target)) setCustomizeOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setCustomizeOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [customizeOpen]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const listRes = await authFetch('/api/automation/leads?limit=100');
      const listData = await listRes.json();
      const leads = listData?.data || [];
      if (!leads.length) {
        toast.error('No leads to export');
        return;
      }
      const res = await authFetch('/api/automation/leads/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, filter: 'all' }),
      });
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'now';

  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-5 pb-4 mb-2 bg-[#F8F9FA]/95 dark:bg-slate-900 backdrop-blur-xl">
      {/* Row 1 — Title + utilities */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#101828] dark:text-slate-100 leading-none">
          Dashboard
        </h1>

        <div className="flex items-center gap-2.5">
          <Link
            href="/automation/chat"
            className="relative inline-flex items-center justify-center w-9 h-9 text-[#344054] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-none transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 hover:border-[#D1D5DB] dark:hover:border-slate-700 active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E5484D] ring-2 ring-white dark:ring-slate-900" />
          </Link>

          <div className="relative flex-1 sm:flex-none sm:w-[220px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] dark:text-slate-400 transition-colors group-focus-within:text-brand-ink" />
            <input
              type="search"
              placeholder="Search something"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/automation/leads?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-none text-[#101828] dark:text-slate-100 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-none transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 hover:border-[#D1D5DB] dark:hover:border-slate-700 active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-[#344054] dark:text-slate-200" />
            Share
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] dark:border-slate-700" />

      {/* Row 2 — Actions + status / import-export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-tour="dashboard-ask-ai"
            onClick={openAssistant}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-white bg-brand rounded-none shadow-sm transition-all duration-200 hover:bg-brand-hover hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <GroviaIcon className="w-4 h-4" />
            Ask AI
          </button>

          <div className="relative" ref={customizeRef}>
            <button
              type="button"
              onClick={() => setCustomizeOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={customizeOpen}
              className={`inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-none transition-all duration-200 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 hover:border-[#D1D5DB] dark:hover:border-slate-700 active:scale-[0.98] ${customizeOpen ? 'bg-[#F9FAFB] dark:bg-slate-900 border-[#D1D5DB] dark:border-slate-700' : ''}`}
            >
              <LayoutGrid className="w-4 h-4 text-[#344054] dark:text-slate-200" />
              Customize Widget
            </button>

            {customizeOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1.5 z-30 min-w-[220px] py-1.5 bg-white dark:bg-slate-900 border border-[#E8ECEF] dark:border-slate-700 rounded-none shadow-[0_12px_32px_rgba(16,24,40,0.12)]"
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] dark:text-slate-400">
                  Show / hide widgets
                </div>
                {DASHBOARD_WIDGETS.map((widget) => {
                  const checked = visibleWidgets ? visibleWidgets[widget.key] !== false : true;
                  return (
                    <button
                      key={widget.key}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      onClick={() => onToggleWidget?.(widget.key)}
                      className="flex w-full items-center justify-between gap-2.5 px-3 py-2 text-[13px] font-medium text-[#344054] dark:text-slate-200 transition-colors hover:bg-[#F6F8F7] dark:hover:bg-slate-800"
                    >
                      {widget.label}
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 border ${checked ? 'bg-brand border-brand' : 'border-[#D0D5DD] dark:border-slate-700'}`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-ink hover:text-brand-ink transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <CheckCircle2 className={`w-4 h-4 ${refreshing ? 'animate-pulse' : ''}`} />
            Last updated {updatedLabel}
          </button>

          <div className="inline-flex items-stretch rounded-none border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <Link
              href="/automation/leads/bulk"
              className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] dark:text-slate-200 transition-colors hover:bg-[#F9FAFB] dark:hover:bg-slate-800"
            >
              <CloudDownload className="w-4 h-4 text-[#344054] dark:text-slate-200" />
              Imports
            </Link>
            <span className="w-px self-stretch bg-[#E5E7EB] dark:bg-slate-800" />
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-9 text-[#6B7280] dark:text-slate-300 transition-colors hover:bg-[#F9FAFB] dark:hover:bg-slate-800"
              aria-label="Import options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="inline-flex items-stretch rounded-none bg-[#101828] dark:bg-slate-700 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1D2939] dark:hover:bg-slate-600 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Exports
            </button>
            <span className="w-px self-stretch bg-white/20 dark:bg-slate-900/20" />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center w-8 h-9 text-white/80 transition-colors hover:bg-[#1D2939] dark:hover:bg-slate-600 disabled:opacity-60"
              aria-label="Export options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
