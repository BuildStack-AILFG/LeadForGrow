'use client';

import DashboardCard from './DashboardCard';
import SectionHeader from './SectionHeader';

export default function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <DashboardCard className={`flex flex-col ${className}`} padding="p-0">
      <div className="px-5 pt-5 pb-3 border-b border-line dark:border-slate-800">
        <SectionHeader title={title} subtitle={subtitle} action={action} />
      </div>
      <div className="p-5 flex-1 min-h-0">{children}</div>
    </DashboardCard>
  );
}
