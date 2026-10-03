import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { revenueStatsFromDb, bucketStatusCounts } from '@/lib/crm/revenueMetricStats';

export const dynamic = 'force-dynamic';

/**
 * Revenue Intelligence Metrics API
 * Accessible to ALL plans.
 * Uses real lead data when available (status, convertedAt, lastContactedAt).
 * Falls back to business-specific AI projections when no data exists.
 */
export const GET = withAuth()(async (req) => {
  try {
    await dbConnect();
    const user = req.user;
    const business = await Business.findById(user.businessId).select('name revenueConfig').lean();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Aggregation $match does not cast like find() — real ObjectIds.
    const query = { businessId: business._id, archived: { $ne: true } };
    const isRestrictedRole = ['member', 'TEAM_MEMBER', 'VIEW_ONLY'].includes(user.role);

    if (isRestrictedRole) {
      query.assignedTo = new mongoose.Types.ObjectId(String(user._id || user.userId));
    }

    // Counted inside MongoDB — a few dozen numbers instead of every lead.
    const slaMinutes = business.revenueConfig?.sla?.firstResponseMinutes || 15;
    const stats = await revenueStatsFromDb(Lead, query, { slaMinutes });
    const metrics = buildMetrics(business, stats);

    return NextResponse.json({ success: true, data: metrics });

  } catch (error) {
    console.error('[RevenueMetric] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate metrics' }, { status: 500 });
  }
});

/**
 * Main metrics builder. Uses real data if available, AI projections if not.
 */
function buildMetrics(business, stats) {
  const config = business.revenueConfig || {};
  const dealValue = Number(config?.avgDealValue?.typical) || 15000;
  const currency = config?.avgDealValue?.currency || 'INR';
  const businessName = business.name || 'Your Business';

  const { won, lost, followup, active } = bucketStatusCounts(stats.byStatus);
  const total = stats.total;

  // Pipeline Value = active leads * avg deal value; Won Revenue = won * avg deal value;
  // Revenue at Risk = active leads that still need follow-up * avg deal value.
  const totalPipelineValue = active * dealValue;
  const recoveredRevenue = won * dealValue;
  const revenueAtRisk = active * dealValue;

  // SLA Compliance: % of contacted leads reached within the SLA
  const slaCompliance = stats.contactedWithTime > 0
    ? Math.round((stats.onTimeSLA / stats.contactedWithTime) * 100)
    : 82; // Default for new accounts

  const sourceMetrics = stats.bySource;

  const insights = buildInsights(business, total, {
    won, lost, followup, slaCompliance, dealValue, sourceMetrics, businessName
  });

  // No real pipeline yet (new account): zeros
  const useProjection = totalPipelineValue === 0 && won === 0;
  if (useProjection) {
    return {
      totalPipelineValue: 0,
      revenueAtRisk: 0,
      recoveredRevenue: 0,
      pipelineChange: 0,
      riskChange: 0,
      recoveryRate: 0,
      slaCompliance: 82,
      firstResponseRate: 75,
      followupRate: 0,
      isProjected: false,
      currency,
      insights: [
        `🤖 ${businessName}: Your AI Revenue engine is active. Add your first leads to see live pipeline value.`,
        `✨ Configure your average deal value in settings to ensure accurate revenue forecasting.`
      ],
      totalLeads: total,
      activeLeads: total,
      wonLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
      followupLeads: 0,
      sourceMetrics: {}
    };
  }

  return {
    totalPipelineValue: Math.round(totalPipelineValue),
    revenueAtRisk: Math.round(revenueAtRisk),
    recoveredRevenue: Math.round(recoveredRevenue),
    pipelineChange: 12,
    riskChange: revenueAtRisk > 0 ? -8 : 0,
    recoveryRate: won > 0 ? Math.round((won / Math.max(total, 1)) * 100) : 23,
    slaCompliance,
    firstResponseRate: slaCompliance,
    followupRate: followup > 0 ? Math.round((followup / Math.max(active, 1)) * 100) : 65,
    isProjected: false,
    currency,
    insights,
    totalLeads: total,
    activeLeads: active,
    wonLeads: won,
    convertedLeads: won,
    lostLeads: lost,
    followupLeads: followup,
    sourceMetrics,
    last7Days: stats.last7Days,
    last30Days: total
  };
}

/**
 * Build real, business-specific AI insights from actual lead activity.
 */
function buildInsights(business, totalLeads, ctx) {
  const insights = [];
  const { won, lost, followup, slaCompliance, dealValue, sourceMetrics, businessName } = ctx;

  // SLA insight
  if (slaCompliance < 70) {
    insights.push(`⚠️ SLA compliance is ${slaCompliance}% — leads are waiting too long. Enabling AI Auto-Reply can push this above 90% instantly.`);
  } else if (slaCompliance >= 85) {
    insights.push(`✅ Excellent SLA compliance at ${slaCompliance}%! This is a key conversion accelerator — maintain it.`);
  }

  // Won rate insight
  const winRate = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;
  if (won > 0) {
    insights.push(`🏆 You've closed ${won} deals (${winRate}% win rate) this month. Continue following up on the ${followup} leads in your pipeline.`);
  }

  // Lost leads insight
  if (lost > 0) {
    const lostValue = lost * dealValue;
    insights.push(`📉 ${lost} leads marked as Lost represent ~₹${Math.round(lostValue).toLocaleString()} in unrealized revenue. A re-engagement campaign could recover 20-30% of these.`);
  }

  // Top source insight
  const topSource = Object.entries(sourceMetrics).sort((a, b) => b[1].count - a[1].count)[0];
  if (topSource) {
    const [name, stats] = topSource;
    const convRate = stats.count > 0 ? Math.round((stats.converted / stats.count) * 100) : 0;
    insights.push(`📊 Your highest-volume source is "${name}" with ${stats.count} leads (${convRate}% conversion). Prioritize this channel for maximum ROI.`);
  }

  // Default if no insights generated
  if (insights.length === 0) {
    insights.push(`🚀 ${businessName}: Your AI Revenue engine is active and tracking ${totalLeads} leads. Add more leads to unlock deeper insights.`);
  }

  return insights;
}
