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
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-5 pb-4 mb-2 bg-canvas">
      {/* Row 1 — Title + utilities */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <h1 className="text-page font-semibold text-fg">
          Dashboard
        </h1>

        <div className="flex items-center gap-2.5">
          <Link
            href="/automation/chat"
            className="relative inline-flex items-center justify-center w-9 h-9 text-fg-secondary bg-canvas border border-line rounded-md transition-all duration-200 hover:bg-subtle hover:border-line-strong active:scale-95"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E5484D] ring-2 ring-white" />
          </Link>

          <div className="relative flex-1 sm:flex-none sm:w-[220px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary transition-colors group-focus-within:text-accent-fg" />
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
              className="w-full h-9 pl-9 pr-3 text-dense bg-canvas border border-line rounded-md text-fg placeholder:text-fg-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-focus/15 focus:border-accent"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3.5 text-dense font-medium text-fg-secondary bg-canvas border border-line rounded-md transition-all duration-200 hover:bg-subtle hover:border-line-strong active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-fg-secondary" />
            Share
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-line" />

      {/* Row 2 — Actions + status / import-export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-tour="dashboard-ask-ai"
            onClick={openAssistant}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-dense font-medium text-white bg-accent rounded-md transition-all duration-200 hover:bg-accent-hover hover:shadow-popover active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
              className={`inline-flex items-center gap-2 h-9 px-3.5 text-dense font-medium text-fg-secondary bg-canvas border border-line rounded-md transition-all duration-200 hover:bg-subtle hover:border-line-strong active:scale-[0.98] ${customizeOpen ? 'bg-subtle border-line-strong' : ''}`}
            >
              <LayoutGrid className="w-4 h-4 text-fg-secondary" />
              Customize Widget
            </button>

            {customizeOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1.5 z-30 min-w-[220px] py-1.5 bg-canvas border border-line rounded-md"
              >
                <div className="px-3 py-1.5 text-meta font-semibold text-fg-tertiary">
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
                      className="flex w-full items-center justify-between gap-2.5 px-3 py-2 text-dense font-medium text-fg-secondary transition-colors hover:bg-subtle"
                    >
                      {widget.label}
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 border ${checked ? 'bg-accent border-accent' : 'border-line-strong'}`}
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
            className="inline-flex items-center gap-1.5 text-dense font-medium text-accent-fg hover:text-accent-fg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <CheckCircle2 className={`w-4 h-4 ${refreshing ? 'animate-pulse' : ''}`} />
            Last updated {updatedLabel}
          </button>

          <div className="inline-flex items-stretch rounded-md border border-line bg-canvas overflow-hidden">
            <Link
              href="/automation/leads/bulk"
              className="inline-flex items-center gap-2 h-9 px-3.5 text-dense font-medium text-fg-secondary transition-colors hover:bg-subtle"
            >
              <CloudDownload className="w-4 h-4 text-fg-secondary" />
              Imports
            </Link>
            <span className="w-px self-stretch bg-muted" />
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-9 text-fg-tertiary transition-colors hover:bg-subtle"
              aria-label="Import options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="inline-flex items-stretch rounded-md bg-accent overflow-hidden">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 h-9 px-3.5 text-dense font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Exports
            </button>
            <span className="w-px self-stretch bg-canvas/20" />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center w-8 h-9 text-white/80 transition-colors hover:bg-accent-hover disabled:opacity-60"
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
