import { WON_STAGES, LOST_STAGES, CLOSED_STAGES } from '../../lib/crm/stageKeys.js';

const OPEN_STATUSES = ['new', 'new_lead', 'contacted', 'first_contact'];
const IN_PROGRESS_STATUSES = [
  'qualified', 'contacted', 'interested', 'follow-up', 'follow_up',
  'demo_scheduled', 'demo_completed', 'quotation_sent',
  'negotiation', 'decision_pending', 'payment_pending',
];
const WON_STATUSES = ['won', 'converted'];
const LOST_STATUS = ['lost'];

const QUALIFICATION_MAP = {
  urgent: 'Hot',
  high: 'Hot',
  medium: 'Warm',
  low: 'Cold',
};

const SOURCE_LABELS = {
  website: 'Website',
  form: 'Forms',
  whatsapp: 'WhatsApp',
  webhook: 'Webhook',
  referral: 'Referral',
  ad: 'Ads',
  call: 'Calls',
  manual: 'Manual',
  bulk: 'Bulk',
  bot: 'Bot',
  instagram_ad: 'Instagram',
  facebook_ad: 'Facebook',
  meta_ads: 'Meta Ads',
  other: 'Other',
};

export function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = startOfDay(new Date(now));
  start.setDate(start.getDate() + mondayOffset + offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function buildHeroKpis(leads = [], deals = [], revenue = {}) {
  const now = new Date();
  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(-1);

  const leadsThisWeek = leads.filter((l) => {
    const at = new Date(l.receivedAt);
    return at >= thisWeek.start && at < thisWeek.end;
  }).length;

  const leadsLastWeek = leads.filter((l) => {
    const at = new Date(l.receivedAt);
    return at >= lastWeek.start && at < lastWeek.end;
  }).length;

  const totalLeads = leads.length;
  const converted = leads.filter((l) => WON_STATUSES.includes(l.status)).length;
  const conversionRate = totalLeads ? Math.round((converted / totalLeads) * 100) : 0;

  const convertedThisWeek = leads.filter((l) => {
    if (!WON_STATUSES.includes(l.status)) return false;
    const at = new Date(l.convertedAt || l.updatedAt);
    return at >= thisWeek.start && at < thisWeek.end;
  }).length;

  const convertedLastWeek = leads.filter((l) => {
    if (!WON_STATUSES.includes(l.status)) return false;
    const at = new Date(l.convertedAt || l.updatedAt);
    return at >= lastWeek.start && at < lastWeek.end;
  }).length;

  const convThisWeek = leadsThisWeek
    ? Math.round((convertedThisWeek / leadsThisWeek) * 100)
    : 0;
  const convLastWeek = leadsLastWeek
    ? Math.round((convertedLastWeek / leadsLastWeek) * 100)
    : 0;

  const cycleDays = [];
  for (const lead of leads) {
    if (!WON_STATUSES.includes(lead.status)) continue;
    const start = new Date(lead.receivedAt);
    const end = new Date(lead.convertedAt || lead.updatedAt);
    const days = Math.max(1, Math.round((end - start) / 86400000));
    cycleDays.push(days);
  }
  const avgCycle = cycleDays.length
    ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length)
    : 0;

  const cycleThisMonth = [];
  const cycleLastMonth = [];
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const lead of leads) {
    if (!WON_STATUSES.includes(lead.status)) continue;
    const end = new Date(lead.convertedAt || lead.updatedAt);
    const start = new Date(lead.receivedAt);
    const days = Math.max(1, Math.round((end - start) / 86400000));
    if (end >= thisMonthStart) cycleThisMonth.push(days);
    else if (end >= lastMonthStart && end < lastMonthEnd) cycleLastMonth.push(days);
  }

  const avgCycleThis = cycleThisMonth.length
    ? Math.round(cycleThisMonth.reduce((a, b) => a + b, 0) / cycleThisMonth.length)
    : avgCycle;
  const avgCycleLast = cycleLastMonth.length
    ? Math.round(cycleLastMonth.reduce((a, b) => a + b, 0) / cycleLastMonth.length)
    : avgCycleThis;

  const isOpenDeal = (d) => d && !CLOSED_STAGES.includes(d.stage);
  const openDeals = deals.filter(isOpenDeal);
  const activeDeals = revenue.openCount ?? openDeals.length;
  const dealsThisWeek = openDeals.filter((d) => {
    const at = new Date(d.createdAt || d.updatedAt);
    return at >= thisWeek.start && at < thisWeek.end;
  }).length;
  const dealsLastWeek = openDeals.filter((d) => {
    const at = new Date(d.createdAt || d.updatedAt);
    return at >= lastWeek.start && at < lastWeek.end;
  }).length;

  return {
    leads: {
      value: totalLeads,
      change: pctChange(leadsThisWeek, leadsLastWeek),
      delta: leadsThisWeek - leadsLastWeek,
      deltaLabel: 'vs last week',
    },
    conversionRate: {
      value: revenue.conversionRate ?? conversionRate,
      change: convThisWeek - convLastWeek,
      delta: convertedThisWeek - convertedLastWeek,
      deltaLabel: 'vs last week',
    },
    avgSalesCycle: {
      value: avgCycle,
      suffix: 'd',
      change: pctChange(avgCycleThis, avgCycleLast) * -1,
      delta: avgCycleThis - avgCycleLast,
      deltaLabel: 'vs last month',
    },
    activeDeals: {
      value: activeDeals,
      change: pctChange(dealsThisWeek, dealsLastWeek),
      delta: dealsThisWeek - dealsLastWeek,
      deltaLabel: 'vs last week',
    },
    pipeline: (() => {
      const pipelineRevenue = Number(revenue.pipelineRevenue) || 0;
      const openAmountsThisWeek = openDeals
        .filter((d) => {
          const at = new Date(d.createdAt || d.updatedAt);
          return at >= thisWeek.start && at < thisWeek.end;
        })
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const openAmountsLastWeek = openDeals
        .filter((d) => {
          const at = new Date(d.createdAt || d.updatedAt);
          return at >= lastWeek.start && at < lastWeek.end;
        })
        .reduce((s, d) => s + (Number(d.amount) || 0), 0);

      const toCompact = (n) => {
        if (n >= 100000) return { value: Math.round((n / 100000) * 10) / 10, suffix: 'L', decimals: 1 };
        if (n >= 1000) return { value: Math.round((n / 1000) * 10) / 10, suffix: 'K', decimals: 1 };
        return { value: Math.round(n), suffix: '', decimals: 0 };
      };
      const compact = toCompact(pipelineRevenue);
      const deltaCompact = toCompact(Math.abs(openAmountsThisWeek - openAmountsLastWeek));
      const deltaSign = openAmountsThisWeek - openAmountsLastWeek >= 0 ? 1 : -1;

      return {
        value: compact.value,
        prefix: '₹',
        suffix: compact.suffix,
        decimals: compact.decimals,
        change: pctChange(openAmountsThisWeek, openAmountsLastWeek),
        delta: deltaSign * deltaCompact.value,
        deltaLabel: `vs last week${deltaCompact.suffix ? ` (${deltaCompact.suffix})` : ''}`,
      };
    })(),
  };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function bucketKey(date, format) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  if (format === 'hour') return `${y}-${m}-${d}T${pad2(date.getHours())}:00`;
  if (format === 'day') return `${y}-${m}-${d}`;
  return `${y}-${m}`;
}

/** Continuous buckets so the chart always has a full X-axis (zeros for empty periods). */
function fillSeries(map, start, end, format) {
  const points = [];
  const cursor = new Date(start);

  if (format === 'hour') {
    cursor.setMinutes(0, 0, 0);
    const limit = new Date(end);
    while (cursor <= limit) {
      const key = bucketKey(cursor, format);
      points.push({ label: key, value: Math.round(map.get(key) || 0) });
      cursor.setHours(cursor.getHours() + 1);
    }
  } else if (format === 'day') {
    cursor.setHours(0, 0, 0, 0);
    const limit = new Date(end);
    limit.setHours(0, 0, 0, 0);
    while (cursor <= limit) {
      const key = bucketKey(cursor, format);
      points.push({ label: key, value: Math.round(map.get(key) || 0) });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    const limit = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= limit) {
      const key = bucketKey(cursor, format);
      points.push({ label: key, value: Math.round(map.get(key) || 0) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // Always at least 2 points so a line can render
  if (points.length === 0) {
    const now = new Date();
    if (format === 'hour') {
      points.push(
        { label: bucketKey(new Date(now.getTime() - 3600000), format), value: 0 },
        { label: bucketKey(now, format), value: 0 }
      );
    } else if (format === 'day') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      points.push({ label: bucketKey(y, format), value: 0 }, { label: bucketKey(now, format), value: 0 });
    } else {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      points.push({ label: bucketKey(prev, format), value: 0 }, { label: bucketKey(now, format), value: 0 });
    }
  } else if (points.length === 1) {
    points.unshift({ ...points[0], value: 0, label: `${points[0].label}-prev` });
  }

  return points;
}

export function buildRevenueSeries(deals = [], currency = 'INR') {
  const wonDeals = deals.filter((d) => WON_STAGES.includes(d.stage));

  const bucket = (start, end, format) => {
    const map = new Map();
    for (const deal of wonDeals) {
      const at = new Date(deal.wonAt || deal.updatedAt);
      if (Number.isNaN(at.getTime()) || at < start || at > end) continue;
      const key = bucketKey(at, format);
      map.set(key, (map.get(key) || 0) + (Number(deal.amount) || 0));
    }
    return fillSeries(map, start, end, format);
  };

  const now = new Date();
  const ranges = {
    '1D': { start: startOfDay(now), end: endOfDay(now), format: 'hour' },
    '1W': { start: new Date(now.getTime() - 6 * 86400000), end: now, format: 'day' },
    '1M': { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, format: 'day' },
    '6M': { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), end: now, format: 'month' },
    '1Y': { start: new Date(now.getFullYear() - 1, now.getMonth(), 1), end: now, format: 'month' },
    ALL: {
      start: wonDeals.length
        ? new Date(Math.min(...wonDeals.map((d) => new Date(d.wonAt || d.updatedAt).getTime())))
        : new Date(now.getFullYear() - 1, now.getMonth(), 1),
      end: now,
      format: 'month',
    },
  };

  // ALL: at least 6 months of axis so the chart never collapses to one point
  if (ranges.ALL.start) {
    const minAll = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    if (ranges.ALL.start > minAll) ranges.ALL.start = minAll;
  }

  const series = {};
  for (const [key, { start, end, format }] of Object.entries(ranges)) {
    series[key] = bucket(start, end, format);
  }

  const totalRevenue = wonDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return { series, totalRevenue: Math.round(totalRevenue), currency };
}

export function buildLeadsManagement(leads = []) {
  const countBy = (statuses) =>
    leads.filter((l) => statuses.includes(l.status)).length;

  const statusItems = [
    { key: 'open', label: 'Open', count: countBy(OPEN_STATUSES) },
    { key: 'in_progress', label: 'In Progress', count: countBy(IN_PROGRESS_STATUSES) },
    { key: 'lost', label: 'Lost', count: countBy(LOST_STATUS) },
    { key: 'won', label: 'Won', count: countBy(WON_STATUSES) },
  ];
  const statusMax = Math.max(...statusItems.map((i) => i.count), 1);
  const status = statusItems.map((i) => ({
    ...i,
    progress: Math.round((i.count / statusMax) * 100),
  }));

  const sourceMap = {};
  for (const lead of leads) {
    const src = lead.source || 'other';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  }
  const sourceItems = Object.entries(sourceMap)
    .map(([key, count]) => ({
      key,
      label: SOURCE_LABELS[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const sourceMax = Math.max(...sourceItems.map((i) => i.count), 1);
  const sources = sourceItems.map((i) => ({
    ...i,
    progress: Math.round((i.count / sourceMax) * 100),
  }));

  const qualMap = { Hot: 0, Warm: 0, Cold: 0, Unscored: 0 };
  for (const lead of leads) {
    const label = QUALIFICATION_MAP[lead.priority] || 'Unscored';
    qualMap[label] = (qualMap[label] || 0) + 1;
  }
  const qualItems = Object.entries(qualMap)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({ key: label.toLowerCase(), label, count }))
    .sort((a, b) => b.count - a.count);
  const qualMax = Math.max(...qualItems.map((i) => i.count), 1);
  const qualification = qualItems.map((i) => ({
    ...i,
    progress: Math.round((i.count / qualMax) * 100),
  }));

  return { status, sources, qualification };
}

export function buildRetentionData(leads = [], months = 7) {
  const now = new Date();
  const topSources = [...new Set(leads.map((l) => l.source || 'other'))]
    .map((src) => ({
      key: src,
      label: SOURCE_LABELS[src] || src,
      count: leads.filter((l) => (l.source || 'other') === src).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const segmentColors = ['#2463EB', '#60A5FA', '#1E3A8A'];
  const segments = topSources.map((s, i) => ({
    key: s.key,
    label: s.label,
    color: segmentColors[i] || '#94A3B8',
  }));

  const monthly = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthLabel = start.toLocaleString('en-US', { month: 'short' });
    const row = { month: monthLabel, values: {} };

    for (const seg of segments) {
      const segLeads = leads.filter((l) => (l.source || 'other') === seg.key);
      const received = segLeads.filter((l) => {
        const at = new Date(l.receivedAt);
        return at >= start && at < end;
      }).length;
      const retained = segLeads.filter((l) => {
        if (!WON_STATUSES.includes(l.status)) return false;
        const at = new Date(l.convertedAt || l.updatedAt);
        return at >= start && at < end;
      }).length;
      row.values[seg.key] = received
        ? Math.round((retained / received) * 100)
        : 0;
    }
    monthly.push(row);
  }

  const totalReceived = leads.length;
  const totalRetained = leads.filter((l) => WON_STATUSES.includes(l.status)).length;
  const rate = totalReceived ? Math.round((totalRetained / totalReceived) * 100) : 0;

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthReceived = leads.filter((l) => new Date(l.receivedAt) >= thisMonthStart).length;
  const lastMonthReceived = leads.filter((l) => {
    const at = new Date(l.receivedAt);
    return at >= lastMonthStart && at < thisMonthStart;
  }).length;
  const thisMonthRetained = leads.filter((l) => {
    if (!WON_STATUSES.includes(l.status)) return false;
    const at = new Date(l.convertedAt || l.updatedAt);
    return at >= thisMonthStart;
  }).length;
  const lastMonthRetained = leads.filter((l) => {
    if (!WON_STATUSES.includes(l.status)) return false;
    const at = new Date(l.convertedAt || l.updatedAt);
    return at >= lastMonthStart && at < thisMonthStart;
  }).length;

  const thisRate = thisMonthReceived
    ? Math.round((thisMonthRetained / thisMonthReceived) * 100)
    : 0;
  const lastRate = lastMonthReceived
    ? Math.round((lastMonthRetained / lastMonthReceived) * 100)
    : 0;

  return {
    rate,
    change: thisRate - lastRate,
    segments,
    monthly,
  };
}

export function buildLocationData(contacts = [], companies = [], leads = []) {
  const countryMap = {};

  for (const contact of contacts) {
    const addrs = contact.addresses || [];
    const primary = addrs.find((a) => a.primary) || addrs[0];
    const country = primary?.country?.trim();
    if (country) countryMap[country] = (countryMap[country] || 0) + 1;
  }

  for (const company of companies) {
    const country = company.address?.country?.trim();
    if (country) countryMap[country] = (countryMap[country] || 0) + 1;
  }

  for (const lead of leads) {
    const country = lead.location?.country?.trim();
    if (country) countryMap[country] = (countryMap[country] || 0) + 1;
  }

  const total = Object.values(countryMap).reduce((a, b) => a + b, 0);
  const items = Object.entries(countryMap)
    .map(([country, count]) => ({
      country,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return items;
}

export function buildCalendarData(meetings = [], year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfDay();
  const days = [];
  const meetingsByDate = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0, 10);
    const dayMeetings = meetings.filter((m) => {
      const start = new Date(m.startTime);
      return (
        start.getFullYear() === year &&
        start.getMonth() === month &&
        start.getDate() === d
      );
    });
    meetingsByDate[iso] = dayMeetings.map((m) => ({
      _id: m._id,
      title: m.notes || m.guest?.name || 'Meeting',
      startTime: m.startTime,
      endTime: m.endTime,
      meetingLink: m.meetingLink,
      leadId: m.leadId,
      guest: m.guest,
      platform: m.meetingLink?.includes('google') || m.meetingLink?.includes('meet.google')
        ? 'Google Meet'
        : m.meetingLink?.includes('zoom')
          ? 'Zoom'
          : m.meetingLink?.includes('slack')
            ? 'Slack'
            : m.meetingLink
              ? 'Video Call'
              : null,
    }));
    days.push({
      date: iso,
      dayName: date.toLocaleString('en-US', { weekday: 'short' }),
      dayNum: d,
      isToday: date.getTime() === today.getTime(),
      meetingCount: dayMeetings.length,
    });
  }

  return { year, month, days, meetingsByDate };
}
