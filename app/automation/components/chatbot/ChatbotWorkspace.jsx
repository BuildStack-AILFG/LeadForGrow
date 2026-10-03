'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot, Loader2, Save, Eye, Rocket, Users, MessageSquare,
  ArrowUpRight, CheckCircle2, PauseCircle
} from 'lucide-react';
import { useChatbotWorkspace } from '../../hooks/useChatbotWorkspace';
import PageLoader from '../PageLoader';
import ChatbotCustomizePanel from './ChatbotCustomizePanel';
import ChatbotInstallPanel from './ChatbotInstallPanel';
import ChatbotPreviewFrame from './ChatbotPreviewFrame';
import { WORKSPACE_TABS } from './constants';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

export default function ChatbotWorkspace() {
  const ws = useChatbotWorkspace();
  const [tab, setTab] = useState('customize');

  if (ws.loading) {
    return <PageLoader label="Loading chatbot…" />;
  }

  const isLive = ws.config.published && ws.config.enabled;

  return (
    <div className="min-h-full bg-subtle dark:bg-slate-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-canvas/90 dark:bg-slate-950/90 border-b border-line dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-canvas border border-line flex items-center justify-center shadow-popover flex-shrink-0">
              <Bot className="w-5 h-5 text-fg-secondary" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-fg dark:text-slate-50 truncate">Website Chatbot</h1>
              <p className="text-xs text-fg-tertiary truncate">Capture & qualify leads from your website — source tagged as Bot</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {ws.dirty && (
              <button
                type="button"
                onClick={() => ws.save()}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                {ws.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            )}
            {isLive ? (
              <button
                type="button"
                onClick={ws.unpublish}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-slate-200 border border-line dark:border-slate-700"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={ws.publish}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white shadow-popover hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                <Rocket className="w-3.5 h-3.5" /> Publish chatbot
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <AutoPageIntro />

        {/* Status + stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Status"
            value={isLive ? 'Live' : 'Draft'}
            icon={isLive ? CheckCircle2 : PauseCircle}
            accent={isLive ? 'emerald' : 'amber'}
          />
          <StatCard label="Bot leads (total)" value={ws.stats.totalLeads ?? 0} icon={Users} accent="teal" />
          <StatCard label="This week" value={ws.stats.weekLeads ?? 0} icon={MessageSquare} accent="blue" />
          <StatCard label="Conversations" value={ws.config.stats?.conversationsStarted ?? 0} icon={Eye} accent="slate" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 w-fit mb-6">
          {WORKSPACE_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === id
                  ? 'bg-accent text-white'
                  : 'text-fg-tertiary hover:text-fg dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'leads' ? (
          <div className="bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 p-8">
            <h2 className="text-lg font-semibold text-fg dark:text-slate-50">Leads from your chatbot</h2>
            <p className="text-sm text-fg-tertiary mt-1 mb-6">
              Every submission is saved with source <span className="font-medium text-fg-secondary dark:text-fg-disabled">Bot</span> and includes the full conversation transcript.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/automation/leads?source=bot"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                View bot leads <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-2">
              <div className="bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 p-6">
                {tab === 'customize' && (
                  <ChatbotCustomizePanel config={ws.config} onChange={ws.patchConfig} />
                )}
                {tab === 'install' && (
                  <ChatbotInstallPanel
                    businessId={ws.businessId}
                    config={ws.config}
                    isPublished={isLive}
                  />
                )}
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 p-4">
                <div className="flex items-center justify-between px-2 pb-3">
                  <p className="text-xs font-semibold text-fg-tertiary flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Live preview
                  </p>
                  <span className="text-meta text-fg-tertiary">Preview mode — leads not saved</span>
                </div>
                <ChatbotPreviewFrame
                  businessId={ws.businessId}
                  config={ws.config}
                  businessName={ws.businessName}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  const colors = {
    emerald: 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/30',
    amber: 'text-warning bg-warning-subtle dark:bg-amber-950/30',
    teal: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/30',
    blue: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/30',
    slate: 'text-fg-secondary bg-muted dark:bg-slate-800',
  };
  return (
    <div className="bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 p-4">
      <div className="flex items-center justify-between">
        <p className="text-meta font-semibold text-fg-tertiary">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-fg dark:text-slate-50 mt-2">{value}</p>
    </div>
  );
}
