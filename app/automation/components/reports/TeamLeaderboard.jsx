'use client';

import { Trophy } from 'lucide-react';
import ChartCard from '../dashboard/primitives/ChartCard';
import ReportsTable from './ReportsTable';

export default function TeamLeaderboard({ team = [] }) {
  const sorted = [...team].sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0));

  const columns = [
    {
      key: 'rank',
      label: '#',
      render: (row) => (
        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
          row.rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {row.rank === 1 ? <Trophy className="w-3 h-3" /> : row.rank}
        </span>
      )
    },
    { key: 'name', label: 'Agent' },
    { key: 'total', label: 'Assigned', render: (r) => <span className="tabular-nums">{r.total}</span> },
    { key: 'converted', label: 'Closed', render: (r) => <span className="tabular-nums text-emerald-600">{r.converted}</span> },
    {
      key: 'rate',
      label: 'Conversion',
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(r.rate, 100)}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums">{r.rate}%</span>
        </div>
      )
    },
    {
      key: 'response',
      label: 'Avg response',
      render: (r) => <span className="text-xs text-slate-500">{r.response}</span>
    }
  ];

  const rows = sorted.map((m, i) => ({
    id: m._id || i,
    rank: i + 1,
    name: m.name || 'Team member',
    total: m.total || 0,
    converted: m.converted || 0,
    rate: Math.round(m.conversionRate || 0),
    response: m.avgResponseTime ? `${Math.round(m.avgResponseTime / 3600000)}h` : '—'
  }));

  return (
    <ChartCard title="Team Performance" subtitle="Conversion leaderboard">
      <ReportsTable columns={columns} rows={rows} emptyMessage="Assign leads to track team performance." />
    </ChartCard>
  );
}
