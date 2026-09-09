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
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20 flex-shrink-0">
              <Bot className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">Website Chatbot</h1>
              <p className="text-xs text-slate-500 truncate">Capture & qualify leads from your website — source tagged as Bot</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {ws.dirty && (
              <button
                type="button"
                onClick={() => ws.save()}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={ws.publish}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-colors disabled:opacity-50"
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
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit mb-6 shadow-sm">
          {WORKSPACE_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'leads' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Leads from your chatbot</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Every submission is saved with source <span className="font-medium text-slate-700 dark:text-slate-300">Bot</span> and includes the full conversation transcript.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/automation/leads?source=bot"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                View bot leads <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between px-2 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Live preview
                  </p>
                  <span className="text-[10px] text-slate-400">Preview mode — leads not saved</span>
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
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    teal: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">{value}</p>
    </div>
  );
}
