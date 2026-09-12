'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import PremiumDashboardHeader from './components/dashboard/premium/PremiumDashboardHeader';
import DashboardSkeleton from './components/dashboard/DashboardSkeleton';
import HeroKpiRow from './components/dashboard/premium/HeroKpiRow';
import RevenueChartCard from './components/dashboard/premium/RevenueChartCard';
import CalendarScheduleCard from './components/dashboard/premium/CalendarScheduleCard';
import LeadsManagementCard from './components/dashboard/premium/LeadsManagementCard';
import RetentionChartCard from './components/dashboard/premium/RetentionChartCard';
import NeedsAttentionCard from './components/dashboard/premium/NeedsAttentionCard';
import PipelineBreakdownCard from './components/dashboard/premium/PipelineBreakdownCard';
import { useAutoStartTour } from './components/shared/tour/useAutoStartTour';
import { TOURS } from './components/shared/tour/registry';

export default function AutomationDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { loading, refreshing, error, refresh, dash, currency } = useDashboardData();
  useAutoStartTour(TOURS.dashboard, !loading);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-full bg-[#F8F9FA]">
      <div className="px-4 sm:px-6 pb-12 max-w-[1560px] mx-auto">
        <PremiumDashboardHeader
          refreshing={refreshing}
          onRefresh={refresh}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          lastUpdated={dash?.lastUpdated}
        />

        {error && (
          <div className="mb-6 flex items-center gap-2.5 px-4 py-3 text-[13px] font-normal text-[#C0353A] bg-[#FEF3F2] border border-[#FECDCA] rounded-none">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/*
            Reference layout:
            [ KPI ] [ KPI ] [ KPI ] | Calendar |
            [ Revenue chart        ] | (spans) |
          */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 content-start auto-rows-min" data-tour="dashboard-kpis">
              <HeroKpiRow heroKpis={dash?.heroKpis} />
              <div className="col-span-2 sm:col-span-3 xl:col-span-5" data-tour="dashboard-revenue">
                <RevenueChartCard revenue={dash?.revenue} currency={currency} onRefresh={refresh} />
              </div>
            </div>

            {/* Absolute fill keeps calendar height = left column; schedule scrolls inside */}
            <div className="lg:col-span-5 xl:col-span-4 relative min-h-[480px] max-h-[640px] lg:max-h-none">
              <div className="h-[640px] lg:h-auto lg:absolute lg:inset-0 flex flex-col min-h-0 overflow-hidden">
                <CalendarScheduleCard calendar={dash?.calendar} onRefresh={refresh} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <LeadsManagementCard leadsManagement={dash?.leadsManagement} onRefresh={refresh} />
            <RetentionChartCard retention={dash?.retention} onRefresh={refresh} />
            <NeedsAttentionCard focus={dash?.focus} currency={currency} onRefresh={refresh} />
          </div>

          <PipelineBreakdownCard pipeline={dash?.pipeline} currency={currency} onRefresh={refresh} />
        </div>
      </div>
    </div>
  );
}
