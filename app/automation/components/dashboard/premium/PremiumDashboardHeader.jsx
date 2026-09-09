'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useBusinessAssistant } from '../../../context/BusinessAssistantContext';
import GroviaIcon from '../../assistant/GroviaIcon';

export default function PremiumDashboardHeader({
  refreshing,
  onRefresh,
  searchQuery,
  onSearchChange,
  lastUpdated,
}) {
  const router = useRouter();
  const { open: openAssistant } = useBusinessAssistant();
  const [exporting, setExporting] = useState(false);

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
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-5 pb-4 mb-2 bg-white/95 backdrop-blur-xl">
      {/* Row 1 — Title + utilities */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#101828] leading-none">
          Dashboard
        </h1>

        <div className="flex items-center gap-2.5">
          <Link
            href="/automation/chat"
            className="relative inline-flex items-center justify-center w-9 h-9 text-[#344054] bg-white border border-[#E5E7EB] rounded-lg transition-all duration-200 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E5484D] ring-2 ring-white" />
          </Link>

          <div className="relative flex-1 sm:flex-none sm:w-[220px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#059669]" />
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
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-[#E5E7EB] rounded-lg text-[#101828] placeholder:text-[#9CA3AF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669]/15 focus:border-[#059669]"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] bg-white border border-[#E5E7EB] rounded-lg transition-all duration-200 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-[#344054]" />
            Share
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB]" />

      {/* Row 2 — Actions + status / import-export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-tour="dashboard-ask-ai"
            onClick={openAssistant}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-white bg-[#2563EB] rounded-lg shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <GroviaIcon className="w-4 h-4" />
            Ask AI
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] bg-white border border-[#E5E7EB] rounded-lg transition-all duration-200 hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98]"
          >
            <LayoutGrid className="w-4 h-4 text-[#344054]" />
            Customize Widget
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#059669] hover:text-[#047857] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <CheckCircle2 className={`w-4 h-4 ${refreshing ? 'animate-pulse' : ''}`} />
            Last updated {updatedLabel}
          </button>

          <div className="inline-flex items-stretch rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
            <Link
              href="/automation/leads/bulk"
              className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]"
            >
              <CloudDownload className="w-4 h-4 text-[#344054]" />
              Imports
            </Link>
            <span className="w-px self-stretch bg-[#E5E7EB]" />
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-9 text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
              aria-label="Import options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="inline-flex items-stretch rounded-lg bg-[#101828] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1D2939] disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Exports
            </button>
            <span className="w-px self-stretch bg-white/20" />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center w-8 h-9 text-white/80 transition-colors hover:bg-[#1D2939] disabled:opacity-60"
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
