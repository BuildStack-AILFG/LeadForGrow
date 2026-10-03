'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, PauseCircle, ArrowUpRight } from 'lucide-react';
import { useChatbotWorkspace } from '../../hooks/useChatbotWorkspace';
import PageLoader from '../PageLoader';
import ChatbotCustomizePanel from './ChatbotCustomizePanel';
import ChatbotInstallPanel from './ChatbotInstallPanel';
import ChatbotPreviewFrame from './ChatbotPreviewFrame';
import { WORKSPACE_TABS } from './constants';
import AutoPageIntro from '../shared/tour/AutoPageIntro';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Tabs from '@/app/components/ui/Tabs';
import MetricStrip from '@/app/components/ui/MetricStrip';

export default function ChatbotWorkspace() {
  const ws = useChatbotWorkspace();
  const [tab, setTab] = useState('customize');

  // Loading→loaded swaps a short skeleton for much taller real content — if the browser
  // carried over a scroll position from wherever the user navigated from, that same
  // scrollTop now lands partway down the real page instead of at its top.
  useEffect(() => {
    if (!ws.loading) window.scrollTo(0, 0);
  }, [ws.loading]);

  if (ws.loading) {
    return <PageLoader label="Loading chatbot…" />;
  }

  const isLive = ws.config.published && ws.config.enabled;

  return (
    <div className="min-h-full bg-subtle">
      <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-page font-semibold text-fg">Website chatbot</h1>
              <Badge tone={isLive ? 'success' : 'neutral'} dot>{isLive ? 'Live' : 'Draft'}</Badge>
            </div>
            <p className="mt-0.5 text-body text-fg-secondary">Greets visitors on your website and saves them as leads.</p>
          </div>
          <div className="flex items-center gap-2">
            {ws.dirty && (
              <Button onClick={() => ws.save()} loading={ws.saving}>Save changes</Button>
            )}
            {isLive ? (
              <Button icon={PauseCircle} onClick={ws.unpublish} disabled={ws.saving}>Unpublish</Button>
            ) : (
              <Button variant="primary" icon={Rocket} onClick={ws.publish} disabled={ws.saving}>Publish</Button>
            )}
          </div>
        </header>

        <AutoPageIntro />

        <MetricStrip
          metrics={[
            { label: 'Leads from chatbot', value: ws.stats.totalLeads ?? 0 },
            { label: 'This week', value: ws.stats.weekLeads ?? 0 },
            { label: 'Conversations started', value: ws.config.stats?.conversationsStarted ?? 0 },
          ]}
        />

        <div className="flex items-end justify-between gap-3">
          <Tabs
            ariaLabel="Chatbot sections"
            tabs={WORKSPACE_TABS.map(({ id, label }) => ({ value: id, label }))}
            value={tab}
            onChange={setTab}
            className="flex-1"
          />
          <Link
            href="/automation/leads?source=bot"
            className="mb-2 inline-flex shrink-0 items-center gap-1 text-dense font-medium text-accent-fg hover:underline"
          >
            View chatbot leads <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-line bg-canvas xl:col-span-3">
            {tab === 'customize' && <ChatbotCustomizePanel config={ws.config} onChange={ws.patchConfig} />}
            {tab === 'install' && (
              <ChatbotInstallPanel
                businessId={ws.businessId}
                config={ws.config}
                isPublished={isLive}
                onPublish={ws.publish}
                publishing={ws.saving}
              />
            )}
          </div>

          <div className="xl:col-span-2">
            <div className="rounded-lg border border-line bg-canvas xl:sticky xl:top-4">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-body font-semibold text-fg">Preview</p>
                <span className="text-meta text-fg-tertiary">Test chats aren’t saved</span>
              </div>
              <div className="p-3">
                <ChatbotPreviewFrame businessId={ws.businessId} config={ws.config} businessName={ws.businessName} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
