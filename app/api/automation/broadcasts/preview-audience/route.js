import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * Count how many leads an audience payload will resolve to, without sending.
 * Powers the "Sends to N people" indicator in the Broadcasts UI.
 * Mirrors lib/broadcasts/engine.js `buildAudience` semantics exactly.
 */
export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { audience = {}, channel = 'whatsapp' } = await req.json();

    const baseQuery = { businessId, archived: { $ne: true } };

    if (audience.type === 'manual') {
      if (!audience.leadIds?.length) return NextResponse.json({ success: true, count: 0 });
      baseQuery._id = { $in: audience.leadIds };
    } else if (audience.type === 'tags') {
      if (!audience.tags?.length) return NextResponse.json({ success: true, count: 0 });
      baseQuery.tags = { $in: audience.tags };
    } else if (audience.type === 'filter' && audience.filters) {
      const f = audience.filters;
      if (f.status) baseQuery.status = f.status;
      if (f.source) baseQuery.source = f.source;
      if (f.tags?.length) baseQuery.tags = { $in: f.tags };
      if (f.assignedTo) baseQuery.assignedTo = f.assignedTo;
    } else {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Engagement filter — applied to both matchedTotal and reachable counts
    if (audience.engagementDays > 0) {
      const cutoff = new Date(Date.now() - audience.engagementDays * 24 * 60 * 60 * 1000);
      baseQuery.lastContactedAt = { $gte: cutoff };
    }

    // Universe = everyone the audience *targets*, before channel filters
    const matchedTotal = await Lead.countDocuments(baseQuery);

    let count = matchedTotal;
    let optedOutCount = 0;
    let missingChannelCount = 0;

    if (channel === 'whatsapp' || channel === 'both') {
      const phoneFilter = { $or: [{ phone: { $exists: true, $nin: ['', null] } }, { whatsapp: { $exists: true, $nin: ['', null] } }] };

      const [reachable, optedOut, noPhone] = await Promise.all([
        Lead.countDocuments({ ...baseQuery, ...phoneFilter, optedOutOfWhatsApp: { $ne: true } }),
        Lead.countDocuments({ ...baseQuery, optedOutOfWhatsApp: true }),
        Lead.countDocuments({ ...baseQuery, $nor: [{ phone: { $exists: true, $nin: ['', null] } }, { whatsapp: { $exists: true, $nin: ['', null] } }] }),
      ]);
      count = reachable;
      optedOutCount = optedOut;
      missingChannelCount = noPhone;
    } else if (channel === 'email') {
      const [reachable, optedOut, noEmail] = await Promise.all([
        Lead.countDocuments({ ...baseQuery, email: { $exists: true, $nin: ['', null] }, optedOutOfEmail: { $ne: true } }),
        Lead.countDocuments({ ...baseQuery, optedOutOfEmail: true }),
        Lead.countDocuments({ ...baseQuery, $or: [{ email: { $exists: false } }, { email: '' }, { email: null }] }),
      ]);
      count = reachable;
      optedOutCount = optedOut;
      missingChannelCount = noEmail;
    }

    const limit = Math.min(audience.limit || 5000, 5000);
    return NextResponse.json({
      success: true,
      count: Math.min(count, limit),
      exactCount: count,
      matchedTotal,
      optedOutCount,
      missingChannelCount,
      truncated: count > limit,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
