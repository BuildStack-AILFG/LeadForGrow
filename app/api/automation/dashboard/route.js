import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Lead from '@/models/automation/Lead';
import { leadStatsFromDb } from '@/lib/crm/leadStats';
import Deal from '@/models/automation/Deal';
import Task from '@/models/automation/Task';
import Activity from '@/models/automation/Activity';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { CLOSED_STAGES } from '@/lib/crm/stageKeys';
import { ensureDefaultPipeline } from '@/lib/crm/pipelines';
import {
  computeDealRevenue,
  buildStageBreakdown,
  monthBounds,
  wonRevenueInRange,
} from '@/lib/crm/revenueMetrics';
import {
  buildHeroKpis,
  buildRevenueSeries,
  buildLeadsManagement,
  buildRetentionData,
  buildCalendarData,
  startOfDay,
  endOfDay,
} from '@/lib/crm/dashboardMetrics';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

const STALE_DAYS = 7;
const AWAITING_FIRST_RESPONSE = ['new', 'new_lead'];
const QUOTATION_WAIT_STAGES = ['demo_completed', 'negotiation', 'decision_pending'];
const MEETING_ACTIVE = ['scheduled', 'confirmed'];

/** Aggregation $match does not cast like find() does — pass a real ObjectId. */
const toObjectId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)));

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const businessId = tenant.business._id;
    const today = startOfDay();
    const tomorrow = startOfDay(new Date(today.getTime() + 86400000));
    const dayAfterTomorrow = startOfDay(new Date(tomorrow.getTime() + 86400000));
    const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000);
    const now = new Date();
    const calYear = now.getFullYear();
    const calMonth = now.getMonth();
    const monthStart = new Date(calYear, calMonth, 1);
    const monthEnd = new Date(calYear, calMonth + 1, 1);

    const pipeline = await ensureDefaultPipeline(businessId);
    const stages = pipeline.stages?.length ? pipeline.stages : [];

    const [
      todayLeads,
      awaitingFirstResponse,
      deals,
      leadStats,
      monthMeetings,
      tasksDueToday,
      tasksOverdue,
      tasksCompletedToday,
      followUpLeads,
      hotLeads,
      activities,
      meetingsToday,
      meetingsTomorrow,
      meetingsNext24h,
    ] = await Promise.all([
      Lead.countDocuments({ businessId, archived: false, receivedAt: { $gte: today, $lt: tomorrow } }),
      Lead.countDocuments({ businessId, archived: false, status: { $in: AWAITING_FIRST_RESPONSE } }),
      Deal.find({ businessId, archived: false })
        .select('title amount currency stage probability updatedAt wonAt lostAt assignedTo leadId')
        .populate('assignedTo', 'firstName lastName')
        .lean(),
      // Counted inside MongoDB — a few dozen numbers instead of every lead document.
      leadStatsFromDb(Lead, { businessId: toObjectId(businessId), archived: false }),
      MeetingBooking.find({
        businessId,
        status: { $in: MEETING_ACTIVE },
        startTime: { $gte: monthStart, $lt: monthEnd },
      })
        .sort({ startTime: 1 })
        .populate('assignedTo', 'firstName lastName email')
        .lean(),
      Task.find({ businessId, status: 'pending', dueDate: { $gte: today, $lte: endOfDay() } })
        .sort({ dueDate: 1 }).limit(12).lean(),
      Task.find({ businessId, status: 'pending', dueDate: { $lt: today } })
        .sort({ dueDate: 1 }).limit(12).lean(),
      Task.find({ businessId, status: 'completed', completedAt: { $gte: today } })
        .sort({ completedAt: -1 }).limit(8).lean(),
      Lead.find({
        businessId,
        archived: false,
        nextFollowUpAt: { $gte: today, $lte: endOfDay() },
      }).select('name phone status assignedTo nextFollowUpAt').limit(10).lean(),
      Lead.find({
        businessId,
        archived: false,
        priority: { $in: ['high', 'urgent'] },
        status: { $nin: ['converted', 'lost', 'won'] },
      }).select('name phone status priority assignedTo').sort({ updatedAt: -1 }).limit(8).lean(),
      Activity.find({ businessId })
        .sort({ performedAt: -1 })
        .limit(20)
        .populate('performedBy', 'firstName lastName email')
        .lean(),
      MeetingBooking.find({
        businessId,
        status: { $in: MEETING_ACTIVE },
        startTime: { $gte: today, $lt: tomorrow },
      }).sort({ startTime: 1 }).limit(10).lean(),
      MeetingBooking.find({
        businessId,
        status: { $in: MEETING_ACTIVE },
        startTime: { $gte: tomorrow, $lt: dayAfterTomorrow },
      }).sort({ startTime: 1 }).limit(10).lean(),
      MeetingBooking.find({
        businessId,
        status: { $in: MEETING_ACTIVE },
        startTime: { $gte: new Date(), $lte: next24h },
      }).sort({ startTime: 1 }).limit(10).lean(),
    ]);

    const revenue = computeDealRevenue(deals);
    const stageBreakdown = buildStageBreakdown(deals, stages);

    const dealsAwaitingQuotation = deals
      .filter((d) => QUOTATION_WAIT_STAGES.includes(d.stage))
      .slice(0, 8)
      .map((d) => ({ _id: d._id, title: d.title, amount: d.amount, currency: d.currency, stage: d.stage }));

    const dealsAwaitingPayment = deals
      .filter((d) => d.stage === 'payment_pending')
      .slice(0, 8)
      .map((d) => ({ _id: d._id, title: d.title, amount: d.amount, currency: d.currency, stage: d.stage }));

    const staleDeals = deals
      .filter((d) => !CLOSED_STAGES.includes(d.stage) && new Date(d.updatedAt) < staleCutoff)
      .slice(0, 8)
      .map((d) => ({ _id: d._id, title: d.title, amount: d.amount, currency: d.currency, stage: d.stage, updatedAt: d.updatedAt }));

    const thisMonth = monthBounds(0);
    const lastMonth = monthBounds(-1);
    const wonThisMonth = Math.round(wonRevenueInRange(deals, thisMonth.start, thisMonth.end));
    const wonLastMonth = Math.round(wonRevenueInRange(deals, lastMonth.start, lastMonth.end));
    const monthChange = wonLastMonth
      ? Math.round(((wonThisMonth - wonLastMonth) / wonLastMonth) * 100)
      : wonThisMonth > 0 ? 100 : 0;

    const meetingsTodayCount = await MeetingBooking.countDocuments({
      businessId,
      status: { $in: MEETING_ACTIVE },
      startTime: { $gte: today, $lt: tomorrow },
    });

    const currency = deals[0]?.currency || 'INR';
    const heroKpis = buildHeroKpis(leadStats, deals, revenue);
    const revenueChart = buildRevenueSeries(deals, currency);
    const leadsManagement = buildLeadsManagement(leadStats);
    const retention = buildRetentionData(leadStats);
    const calendar = buildCalendarData(monthMeetings, calYear, calMonth);

    return NextResponse.json({
      success: true,
      data: {
        lastUpdated: new Date().toISOString(),
        currency,
        heroKpis,
        revenue: {
          ...revenue,
          wonThisMonth,
          wonLastMonth,
          monthChange,
          chart: revenueChart,
        },
        leadsManagement,
        retention,
        calendar,
        kpis: {
          newLeadsToday: todayLeads,
          leadsAwaitingFirstResponse: awaitingFirstResponse,
          activeDeals: revenue.openCount,
          pipelineRevenue: revenue.pipelineRevenue,
          wonRevenue: revenue.wonRevenue,
          lostRevenue: revenue.lostRevenue,
          meetingsToday: meetingsTodayCount,
          tasksDueToday: tasksDueToday.length,
        },
        focus: {
          followUpsToday: followUpLeads,
          dealsAwaitingQuotation,
          dealsAwaitingPayment,
          meetingsNext24h,
          overdueTasks: tasksOverdue,
          hotLeads,
          staleDeals,
        },
        pipeline: stageBreakdown,
        activities,
        meetings: { today: meetingsToday, tomorrow: meetingsTomorrow },
        tasks: {
          dueToday: tasksDueToday,
          overdue: tasksOverdue,
          completedRecently: tasksCompletedToday,
        },
      },
    });
  } catch (error) {
    console.error('[CRM Dashboard]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
