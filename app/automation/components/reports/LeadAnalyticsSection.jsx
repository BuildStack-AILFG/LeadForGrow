'use client';

import ChartCard from '../dashboard/primitives/ChartCard';
import SimpleBarChart from '../dashboard/charts/SimpleBarChart';
import { formatSource } from './utils';
import { SOURCE_COLORS } from './constants';

export default function LeadAnalyticsSection({ sources = [], totalLeads = 0, statusCounts = {} }) {
  const sourceData = sources.map((s) => ({
    label: formatSource(s._id),
    value: s.count,
    color: SOURCE_COLORS[String(s._id || '').toLowerCase()] || SOURCE_COLORS.default
  }));

  const stageData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ label: formatSource(k), value: v }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Leads by Source" subtitle="Attribution breakdown">
        <SimpleBarChart data={sourceData} color="#1D4B3E" />
      </ChartCard>
      <ChartCard title="Leads by Stage" subtitle="Pipeline distribution">
        <SimpleBarChart data={stageData} color="#5C8F8A" />
      </ChartCard>
    </div>
  );
}
