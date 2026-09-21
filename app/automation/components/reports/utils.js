import { formatCurrency } from '@/lib/crm/formatCurrency';

export { formatCurrency };

export function computeTrend(dailyTrends = []) {
  if (!dailyTrends?.length) return 0;
  const sorted = [...dailyTrends].sort((a, b) => String(a._id).localeCompare(String(b._id)));
  const mid = Math.max(1, Math.floor(sorted.length / 2));
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const sumFirst = firstHalf.reduce((s, d) => s + (d.leads || 0), 0);
  const sumSecond = secondHalf.reduce((s, d) => s + (d.leads || 0), 0);
  if (sumFirst === 0) return sumSecond > 0 ? 100 : 0;
  return Math.round(((sumSecond - sumFirst) / sumFirst) * 100);
}

export function formatSource(source) {
  if (!source) return 'Unknown';
  return String(source).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatHours(hours) {
  if (!hours && hours !== 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours}h`;
}

export function buildSparkline(dailyTrends, key = 'leads', points = 12) {
  if (!dailyTrends?.length) return [];
  const sorted = [...dailyTrends].sort((a, b) => a._id.localeCompare(b._id));
  return sorted.slice(-points).map((d) => d[key] || 0);
}

export function computeWhatsAppStats(conversations = []) {
  const total = conversations.length;
  const unread = conversations.filter((c) => c.status === 'unread' || c.unreadCount > 0).length;
  const intervened = conversations.filter((c) => c.status === 'intervened').length;
  const replyRate = total > 0 ? Math.round(((total - unread) / total) * 100) : 0;
  return { total, unread, intervened, replyRate };
}

export function computeFollowUpStats(tasks = { overdue: 0, today: 0, upcoming: 0, completed: 0 }) {
  const pending = tasks.overdue + tasks.today + tasks.upcoming;
  const total = pending + tasks.completed;
  const successRate = total > 0 ? Math.round((tasks.completed / total) * 100) : 0;
  return { pending, overdue: tasks.overdue, successRate };
}

export function buildInsights({ reports, metrics, teamPerformance, whatsapp, followUp, trend }) {
  const insights = [];
  const sources = reports?.leadsBySource || [];
  const topSource = sources[0];
  if (topSource && reports?.totalLeads > 0) {
    const pct = Math.round((topSource.count / reports.totalLeads) * 100);
    insights.push({
      id: 'top-source',
      text: `${formatSource(topSource._id)} leads account for ${pct}% of volume this period.`
    });
  }

  if (typeof trend === 'number') {
    insights.push({
      id: 'lead-trend',
      text: trend >= 0
        ? `Lead volume is up ${Math.abs(trend)}% compared to the prior half of this period.`
        : `Lead volume declined ${Math.abs(trend)}% compared to the prior half of this period.`
    });
  }

  if (reports?.avgResponseTimeHours) {
    insights.push({
      id: 'response',
      text: `Average first response time is ${formatHours(reports.avgResponseTimeHours)} across contacted leads.`
    });
  }

  const topAgent = [...(teamPerformance || [])].sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))[0];
  if (topAgent?.name) {
    insights.push({
      id: 'top-agent',
      text: `${topAgent.name} has the highest conversion rate at ${Math.round(topAgent.conversionRate || 0)}%.`
    });
  }

  if (whatsapp?.unread > 0) {
    insights.push({
      id: 'wa-unread',
      text: `${whatsapp.unread} WhatsApp conversations need attention — reply rate is ${whatsapp.replyRate}%.`
    });
  }

  if (followUp?.overdue > 0) {
    insights.push({
      id: 'followup',
      text: `${followUp.overdue} follow-ups are overdue. Prioritize task completion to protect pipeline.`
    });
  }

  if (reports?.notContactedCount > 0) {
    insights.push({
      id: 'not-contacted',
      text: `${reports.notContactedCount} leads have not been contacted yet.`
    });
  }

  return insights.slice(0, 5);
}

export function buildKPIs({ reports, metrics, whatsapp, followUp, teamPerformance, trend }) {
  const sc = reports?.statusCounts || {};
  const qualified = (sc.contacted || 0) + (sc['follow-up'] || 0);
  const teamAvg =
    teamPerformance?.length > 0
      ? Math.round(teamPerformance.reduce((s, m) => s + (m.conversionRate || 0), 0) / teamPerformance.length)
      : 0;

  return [
    { id: 'totalLeads', label: 'Total Leads', value: reports?.totalLeads || 0, trend, accent: 'blue', sparkKey: 'leads' },
    { id: 'qualified', label: 'Qualified Leads', value: qualified, accent: 'green', sparkKey: 'leads' },
    { id: 'conversion', label: 'Conversion Rate', value: `${reports?.conversionRate || 0}%`, accent: 'green', sparkKey: 'conversions' },
    { id: 'pipeline', label: 'Revenue Pipeline', value: formatCurrency(metrics?.totalPipelineValue, metrics?.currency), accent: 'blue' },
    { id: 'closed', label: 'Deals Won', value: sc.converted || reports?.converted || 0, accent: 'green', sparkKey: 'conversions' },
    { id: 'response', label: 'Avg Response', value: formatHours(reports?.avgResponseTimeHours), accent: 'slate' },
    { id: 'followup', label: 'Follow-up Success', value: `${followUp?.successRate || 0}%`, accent: 'amber' },
    { id: 'whatsapp', label: 'WhatsApp Reply Rate', value: `${whatsapp?.replyRate || 0}%`, accent: 'green' },
    { id: 'productivity', label: 'Team Productivity', value: `${teamAvg}%`, accent: 'blue' },
    { id: 'lost', label: 'Lost Leads', value: sc.lost || reports?.lost || 0, accent: 'amber', invertTrend: true }
  ];
}

export function filterSources(sources, sourceFilter) {
  if (!sourceFilter || sourceFilter === 'all') return sources;
  return sources.filter((s) => String(s._id || '').toLowerCase().includes(sourceFilter));
}

export function filterStatusCounts(statusCounts, stageFilter) {
  if (!stageFilter || stageFilter === 'all') return statusCounts;
  return Object.fromEntries(
    Object.entries(statusCounts || {}).filter(([k]) => k === stageFilter)
  );
}

export function exportReportsCSV(reports, metrics) {
  const rows = [
    ['Metric', 'Value'],
    ['Period (days)', reports?.period || ''],
    ['Total Leads', reports?.totalLeads || 0],
    ['Conversion Rate', `${reports?.conversionRate || 0}%`],
    ['Avg Response (hours)', reports?.avgResponseTimeHours || 0],
    ['Pipeline Value', metrics?.totalPipelineValue || 0],
    ['Not Contacted', reports?.notContactedCount || 0],
    [],
    ['Source', 'Count']
  ];
  (reports?.leadsBySource || []).forEach((s) => {
    rows.push([formatSource(s._id), s.count]);
  });
  rows.push([], ['Team Member', 'Leads', 'Converted', 'Conversion %']);
  (reports?.teamPerformance || []).forEach((m) => {
    rows.push([m.name, m.total, m.converted, Math.round(m.conversionRate || 0)]);
  });

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leadforgrow-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportsExcel(reports) {
  exportReportsCSV(reports, null);
}
