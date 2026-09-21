/**
 * Ban-safety for AUTOMATED Instagram/Facebook sends (comment replies, comment→DM,
 * flows, sequences). Manual replies typed by a human in the inbox are not limited.
 *
 * Why: Meta's anti-spam blocks accounts that suddenly send a lot. A brand-new
 * automation on a small account is exactly that pattern, so limits start LOW and ramp
 * up with the age of the automation ("warm-up"), and when Meta does block an account
 * (error 368) we pause automation for a cool-off instead of hammering it, then
 * restart the warm-up. These numbers are conservative house heuristics, NOT figures
 * published by Meta — tune TIERS below, or set `limitMultiplier` per business.
 *
 * Counters live in MongoDB (fixed hour/day windows, atomic, TTL-expired) so this
 * works with or without Redis and survives restarts.
 */
import SendCounter from '@/models/omnichannel/SendCounter';
import SendSafetyState from '@/models/omnichannel/SendSafetyState';

export const BLOCK_COOLOFF_HOURS = 48;
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/** Warm-up ramp: the last tier whose `fromDay` <= the automation's age (in days) applies. */
export const TIERS = [
  { fromDay: 0,  dm: { hour: 5,  day: 30  }, reply: { hour: 10,  day: 60  } },
  { fromDay: 3,  dm: { hour: 15, day: 100 }, reply: { hour: 30,  day: 200 } },
  { fromDay: 7,  dm: { hour: 30, day: 250 }, reply: { hour: 60,  day: 400 } },
  { fromDay: 14, dm: { hour: 60, day: 500 }, reply: { hour: 100, day: 800 } },
];

const LABEL = { instagram: 'Instagram', facebook: 'Facebook' };

export function ageInDays(startedAt, now = new Date()) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / DAY));
}

export function tierFor(startedAt, now = new Date()) {
  const age = ageInDays(startedAt, now);
  let tier = TIERS[0];
  for (const t of TIERS) if (age >= t.fromDay) tier = t;
  return { tier, ageDays: age };
}

/** Caps for one kind of send after applying the business's multiplier (never below 1). */
export function capsFor(state, kind, now = new Date()) {
  const { tier, ageDays } = tierFor(state?.automationStartedAt, now);
  const m = state?.limitMultiplier > 0 ? state.limitMultiplier : 1;
  const base = tier[kind];
  return { hour: Math.max(1, Math.ceil(base.hour * m)), day: Math.max(1, Math.ceil(base.day * m)), ageDays };
}

const hourKey = (d) => d.toISOString().slice(0, 13); // 2026-09-19T14
const dayKey = (d) => d.toISOString().slice(0, 10);  // 2026-09-19

/** Atomically add 1 to a counter unless it is already at `cap`. False = cap reached. */
async function consume(filter, cap, expireAt) {
  try {
    // The `count < cap` filter makes an at-cap document fail to match, so the upsert
    // tries to insert a duplicate key (E11000) — that is how we detect "full".
    await SendCounter.updateOne(
      { ...filter, count: { $lt: cap } },
      { $inc: { count: 1 }, $setOnInsert: { expireAt } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    if (err?.code !== 11000) throw err;
    // Duplicate key means EITHER the counter is full, OR two first-ever sends raced to insert it
    // (the loser gets E11000 with the count still at 1). Retry once as a plain increment, which
    // only succeeds if there is still room.
    try {
      const r = await SendCounter.updateOne({ ...filter, count: { $lt: cap } }, { $inc: { count: 1 } });
      return (r?.modifiedCount ?? r?.nModified ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Ask permission for ONE automated send.
 * @param kind 'dm' (DM / private reply) | 'reply' (public comment reply)
 * @returns {{allowed: boolean, reason?: 'blocked'|'daily'|'hourly', message?: string, until?: Date}}
 * Fails OPEN on database errors — a safety feature must never take down normal replies.
 */
export async function allowAutomatedSend(business, channel, kind, now = new Date()) {
  const businessId = business?._id;
  if (!businessId) return { allowed: true };
  const label = LABEL[channel] || channel;
  try {
    const state = await SendSafetyState.findOne({ businessId, channel }).lean();

    if (state?.blockedUntil && new Date(state.blockedUntil) > now) {
      return {
        allowed: false,
        reason: 'blocked',
        until: state.blockedUntil,
        message: `Automated ${label} messages are paused until ${new Date(state.blockedUntil).toUTCString()} because ${label} temporarily limited this account.`,
      };
    }

    const caps = capsFor(state, kind, now);
    const base = { businessId, channel, kind };
    const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 2 * DAY);
    const hourEnd = new Date(now.getTime() + 3 * HOUR);

    let denied = null;
    if (!(await consume({ ...base, window: 'd', key: dayKey(now) }, caps.day, dayEnd))) denied = 'daily';
    else if (!(await consume({ ...base, window: 'h', key: hourKey(now) }, caps.hour, hourEnd))) denied = 'hourly';

    if (denied) {
      const today = dayKey(now);
      const sameDay = state?.throttled?.day === today;
      await SendSafetyState.updateOne(
        { businessId, channel },
        { $set: { 'throttled.day': today, 'throttled.count': (sameDay ? state.throttled.count || 0 : 0) + 1 } },
        { upsert: true }
      );
      return {
        allowed: false,
        reason: denied,
        message: `Held back by the ${label} safety limit (${denied === 'daily' ? caps.day + ' per day' : caps.hour + ' per hour'} while this automation warms up).`,
      };
    }

    if (!state?.automationStartedAt) {
      await SendSafetyState.updateOne({ businessId, channel }, { $setOnInsert: { automationStartedAt: now } }, { upsert: true });
    }
    return { allowed: true };
  } catch (err) {
    console.warn(`[sendSafety] check failed, allowing send: ${err.message}`);
    return { allowed: true };
  }
}

/** Tell owners/admins in-app. Never throws. */
async function notifyOwners(businessId, { title, message }) {
  try {
    const [{ default: User }, { default: Notification }, { emitNotification }] = await Promise.all([
      import('@/models/User'),
      import('@/models/automation/Notification'),
      import('@/lib/realtime/publish'),
    ]);
    const users = await User.find({
      businessId,
      isActive: { $ne: false },
      role: { $in: ['owner', 'admin', 'CLIENT_ADMIN', 'AGENCY_OWNER', 'SUPER_ADMIN', 'super'] },
    }).select('_id').lean();
    for (const u of users) {
      const n = await Notification.create({
        businessId, userId: u._id, type: 'automation_alert', title, message,
        link: '/automation/settings/channels', metadata: { source: 'sendSafety' },
      });
      await emitNotification(businessId, { notificationId: n._id, userId: u._id, type: n.type, title, message, link: n.link });
    }
  } catch (err) {
    console.warn(`[sendSafety] could not notify: ${err.message}`);
  }
}

/**
 * Feed every send result back in. A platform block (368) pauses automation for
 * BLOCK_COOLOFF_HOURS and restarts the warm-up; an expired token / missing
 * permission is recorded so the UI can ask the user to reconnect. Alerts fire once
 * per issue, not once per failed send. Never throws.
 */
export async function recordSendResult(business, channel, result, now = new Date()) {
  try {
    const kind = result?.kind;
    const businessId = business?._id;
    if (!businessId || result?.success || !kind) return;
    if (!['action_blocked', 'token_expired', 'permission'].includes(kind)) return;

    const label = LABEL[channel] || channel;
    const state = await SendSafetyState.findOne({ businessId, channel }).lean();
    const issue = { kind, code: result.code, subcode: result.subcode, message: result.error, at: now };

    if (kind === 'action_blocked') {
      const alreadyBlocked = state?.blockedUntil && new Date(state.blockedUntil) > now;
      if (alreadyBlocked) return; // don't extend the pause or re-alert while it is active
      const until = new Date(now.getTime() + BLOCK_COOLOFF_HOURS * HOUR);
      await SendSafetyState.updateOne(
        { businessId, channel },
        { $set: { blockedUntil: until, automationStartedAt: until, lastIssue: { ...issue, notifiedAt: now } } },
        { upsert: true }
      );
      await notifyOwners(businessId, {
        title: `${label} paused automated messages`,
        message: `${label} temporarily limited messaging on this account. Automated replies are paused for ${BLOCK_COOLOFF_HOURS} hours to avoid making it worse, then restart slowly.`,
      });
      return;
    }

    // token_expired / permission: alert at most once per 24h
    const recentlyNotified = state?.lastIssue?.kind === kind && state.lastIssue.notifiedAt
      && now.getTime() - new Date(state.lastIssue.notifiedAt).getTime() < DAY;
    await SendSafetyState.updateOne(
      { businessId, channel },
      { $set: { lastIssue: { ...issue, notifiedAt: recentlyNotified ? state.lastIssue.notifiedAt : now } } },
      { upsert: true }
    );
    if (!recentlyNotified) {
      await notifyOwners(businessId, {
        title: `${label} needs to be reconnected`,
        message: kind === 'token_expired'
          ? `Your ${label} connection has expired or was disconnected, so replies can't be sent. Reconnect it in Settings.`
          : `${label} rejected a send because a permission is missing. Reconnect ${label} and approve all permissions.`,
      });
    }
  } catch (err) {
    console.warn(`[sendSafety] could not record send result: ${err.message}`);
  }
}

/** Summary for the settings UI. */
export async function getSafetySummary(businessId, channel, now = new Date()) {
  const state = await SendSafetyState.findOne({ businessId, channel }).lean();
  const dm = capsFor(state, 'dm', now);
  const reply = capsFor(state, 'reply', now);
  const blocked = !!(state?.blockedUntil && new Date(state.blockedUntil) > now);
  return {
    blocked,
    blockedUntil: blocked ? state.blockedUntil : null,
    issue: state?.lastIssue?.kind ? { kind: state.lastIssue.kind, message: state.lastIssue.message, at: state.lastIssue.at } : null,
    warmupDay: dm.ageDays + 1,
    limits: { dm: { hour: dm.hour, day: dm.day }, reply: { hour: reply.hour, day: reply.day } },
    heldBackToday: state?.throttled?.day === dayKey(now) ? state.throttled.count || 0 : 0,
  };
}

export default { allowAutomatedSend, recordSendResult, getSafetySummary, capsFor, tierFor, TIERS, BLOCK_COOLOFF_HOURS };
