import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withPlanAccess } from '@/lib/accessControl';
import { dbConnect } from '@/lib/mongodb';
import { isManagerRole } from '@/lib/omnichannel/inboxViews';

/**
 * Wrapper for Leak Radar APIs: signed in, on a plan with automation, with a
 * business. The business always comes from the session, never the request.
 */
export function leakRoute(handler) {
  return withPlanAccess('automation', async (req, ctx) => {
    if (!req.user?.businessId) {
      return NextResponse.json({ success: false, error: 'No business workspace' }, { status: 403 });
    }
    try {
      await dbConnect();
      return await handler(req, ctx, {
        businessId: new mongoose.Types.ObjectId(String(req.user.businessId)),
        userId: req.user.userId ? new mongoose.Types.ObjectId(String(req.user.userId)) : null,
        manager: isManagerRole(req.user.role),
      });
    } catch (err) {
      console.error('[leak api]', err);
      return NextResponse.json({ success: false, error: err.status ? err.message : 'Something went wrong' }, { status: err.status || 500 });
    }
  });
}

export const bad = (error, status = 400) => NextResponse.json({ success: false, error }, { status });
export const ok = (data) => NextResponse.json({ success: true, data });

/** Open leaks the team should see now: not in the comparison group, not snoozed. */
export function shownOpenFilter(businessId, now = new Date()) {
  return {
    businessId,
    status: 'open',
    holdout: { $ne: true },
    $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }],
  };
}

export const SEVERITY_RANK = { $indexOfArray: [['high', 'medium', 'low'], '$severity'] };
