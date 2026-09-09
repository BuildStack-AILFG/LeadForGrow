'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useReportsWorkspace } from '../hooks/useReportsWorkspace';
import ReportsHeader from '../components/reports/ReportsHeader';
import FilterBar from '../components/reports/FilterBar';
import KPIGrid from '../components/reports/KPIGrid';
import ReportsSkeleton from '../components/reports/ReportsSkeleton';
import InsightsPanel from '../components/reports/InsightsPanel';
import ActivityFeed from '../components/reports/ActivityFeed';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';
import DiscoveryLink from '@/app/automation/components/shared/tour/DiscoveryLink';

const RevenueChart = dynamic(() => import('../components/reports/RevenueChart'), {
  loading: () => <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />,
  ssr: false
});
const FunnelChart = dynamic(() => import('../components/reports/FunnelChart'), { ssr: false });
const LeadAnalyticsSection = dynamic(() => import('../components/reports/LeadAnalyticsSection'), { ssr: false });
const SalesAnalyticsSection = dynamic(() => import('../components/reports/SalesAnalyticsSection'), { ssr: false });
const WhatsAppAnalytics = dynamic(() => import('../components/reports/WhatsAppAnalytics'), { ssr: false });
const CRMHeatmap = dynamic(() => import('../components/reports/CRMHeatmap'), { ssr: false });
const TeamLeaderboard = dynamic(() => import('../components/reports/TeamLeaderboard'), { ssr: false });
const FollowUpAnalytics = dynamic(() => import('../components/reports/FollowUpAnalytics'), { ssr: false });
const CampaignAnalytics = dynamic(() => import('../components/reports/CampaignAnalytics'), { ssr: false });

function ReportsContent() {
  const ws = useReportsWorkspace();

  if (ws.loading) return <ReportsSkeleton />;

  const statusCounts = ws.reports?.statusCounts || {};

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
      <div className="px-4 sm:px-6 pb-8 max-w-[1600px] mx-auto">
        <ReportsHeader
          period={ws.period}
          onPeriodChange={ws.setPeriod}
          refreshing={ws.refreshing}
          onRefresh={ws.refresh}
          reports={ws.reports}
          metrics={ws.metrics}
          savedViews={ws.savedViews}
          onSaveView={ws.saveCurrentView}
          onApplyView={ws.applySavedView}
        />

        <AutoPageIntro />

        {ws.error && (
          <div className="mt-4 px-4 py-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            {ws.error}
          </div>
        )}

        <div className="mt-4 mb-4">
          <KPIGrid kpis={ws.kpis} dailyTrends={ws.reports?.dailyTrends} trend={ws.trend} />
        </div>

        <div className="mb-4">
          <FilterBar
            sourceFilter={ws.sourceFilter}
            onSourceChange={ws.setSourceFilter}
            stageFilter={ws.stageFilter}
            onStageChange={ws.setStageFilter}
            assigneeFilter={ws.assigneeFilter}
            onAssigneeChange={ws.setAssigneeFilter}
            teamMembers={ws.teamMembers}
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <RevenueChart dailyTrends={ws.reports?.dailyTrends} period={ws.period} />
            </div>
            <FunnelChart statusCounts={statusCounts} totalLeads={ws.reports?.totalLeads} />
          </div>

          <InsightsPanel insights={ws.insights} />

          <DiscoveryLink
            text="Want deeper insights?"
            cta="Explore Automation Analytics"
            href="/automation/automation-analytics"
          />

          <LeadAnalyticsSection
            sources={ws.filteredSources}
            totalLeads={ws.reports?.totalLeads}
            statusCounts={statusCounts}
          />

          <SalesAnalyticsSection reports={ws.reports} metrics={ws.metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WhatsAppAnalytics stats={ws.whatsapp} />
            <FollowUpAnalytics stats={ws.taskStats} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TeamLeaderboard team={ws.filteredTeam} />
            <CRMHeatmap data={ws.reports?.hourlyHeatmap} />
          </div>

          <CampaignAnalytics sources={ws.filteredSources} totalLeads={ws.reports?.totalLeads} />

          <ActivityFeed activities={ws.activities} recentLeads={ws.reports?.recentLeads} />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}
