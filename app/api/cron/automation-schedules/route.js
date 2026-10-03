import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import Lead from '@/models/automation/Lead';
import Business from '@/models/Business';
import { shouldRunSchedule, isWithinBusinessHoursWindow } from '@/lib/automation/scheduleEvaluator';
import { sequenceEngine } from '@/lib/sequences/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

function authorize(request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return process.env.NODE_ENV !== 'production';
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const sequences = await AutomationSequence.find({
      triggerType: 'recurring',
      status: 'active',
      enabled: { $ne: false },
    }).lean();

    const results = [];
    const now = new Date();

    for (const seq of sequences) {
      const config = seq.triggerConfig || {};
      if (!shouldRunSchedule(config, seq.lastScheduledRunAt, now)) continue;

      const business = await Business.findById(seq.businessId).lean();
      if (!business) continue;
      if (config.businessHoursOnly && !isWithinBusinessHoursWindow(business, now)) continue;

      const audience = config.audience || 'active_leads';
      let leads = [];
      if (audience === 'all_leads' || audience === 'active_leads') {
        const q = { businessId: seq.businessId, archived: { $ne: true } };
        if (audience === 'active_leads') q.status = { $nin: ['lost', 'converted', 'cold'] };
        leads = await Lead.find(q).limit(config.maxLeadsPerRun || 100).lean();
      } else if (config.leadIds?.length) {
        leads = await Lead.find({ _id: { $in: config.leadIds }, businessId: seq.businessId }).lean();
      }

      let started = 0;
      for (const lead of leads) {
        if (lead.activeSequenceId?.toString() === seq._id.toString()) continue;
        await sequenceEngine.startWorkflow(lead, seq._id);
        started++;
      }

      await AutomationSequence.updateOne({ _id: seq._id }, { $set: { lastScheduledRunAt: now } });
      results.push({ sequenceId: seq._id, name: seq.name, started });
    }

    return NextResponse.json({ success: true, processed: sequences.length, results });
  } catch (error) {
    console.error('[Cron:Schedules]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}
