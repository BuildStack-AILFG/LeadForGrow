/**
 * Leak Radar daily brief (server side): gather yesterday's numbers and email
 * the owner through the business's own mailbox (same path as staff
 * notifications). Once per day, after 08:00 in the business's time zone.
 */
import Business from '@/models/Business';
import User from '@/models/User';
import LeakFlag from '@/models/leak/LeakFlag';
import LeakAction from '@/models/leak/LeakAction';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { sendBusinessEmail } from '@/lib/businessMailer';
import { createTransporterForAccount, formatFromHeader } from '@/lib/omnichannel/mailerFromAccount';
import { digestContent, digestDueToday } from '@/lib/leak/digestContent';

const DAY = 24 * 60 * 60 * 1000;
const SHOWN_OPEN = (bizId, now) => ({
  businessId: bizId,
  status: 'open',
  holdout: { $ne: true },
  $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }],
});

export async function sendBusinessDigest(business, now = new Date()) {
  const lg = business.settings?.leakGuard || {};
  const off = (lg.businessHours?.tzOffsetMinutes ?? 330) * 60 * 1000;
  // "Yesterday" in the business's own time zone.
  const localMidnight = Math.floor((now.getTime() + off) / DAY) * DAY - off;
  const from = new Date(localMidnight - DAY);
  const to = new Date(localMidnight);
  const bizId = business._id;

  // Counted in leads (one customer = one problem), like the Leak Radar page.
  const [newYesterday, openNow, handled, perRep, topLeak] = await Promise.all([
    LeakFlag.distinct('leadId', { businessId: bizId, holdout: { $ne: true }, detectedAt: { $gte: from, $lt: to } }).then((r) => r.length),
    LeakFlag.distinct('leadId', SHOWN_OPEN(bizId, now)).then((r) => r.length),
    LeakAction.distinct('leadId', { businessId: bizId, createdAt: { $gte: from, $lt: to }, actionType: { $nin: ['snoozed'] } }),
    LeakFlag.aggregate([
      { $match: { ...SHOWN_OPEN(bizId, now), assignedTo: { $ne: null } } },
      { $group: { _id: { owner: '$assignedTo', lead: '$leadId' } } },
      { $group: { _id: '$_id.owner', open: { $sum: 1 } } },
      { $sort: { open: -1 } },
      { $limit: 1 },
    ]),
    LeakFlag.aggregate([
      { $match: SHOWN_OPEN(bizId, now) },
      { $addFields: { rank: { $indexOfArray: [['high', 'medium', 'low'], '$severity'] } } },
      { $sort: { rank: 1, detectedAt: 1 } },
      { $limit: 1 },
      { $project: { 'lead.name': 1, reason: 1 } },
    ]).then((rows) => rows[0] || null),
  ]);

  let topRep = null;
  if (perRep[0]) {
    const u = await User.findById(perRep[0]._id).select('firstName lastName email').lean();
    topRep = { name: [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'A teammate', open: perRep[0].open };
  }

  const atRisk = lg.avgDealValue > 0 && lg.conversionPct > 0 ? openNow * lg.avgDealValue * (lg.conversionPct / 100) : null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://leadforgrow.com';
  const content = digestContent({
    businessName: business.businessName || 'Your business',
    newYesterday,
    openNow,
    atRisk,
    recoveredYesterday: handled.length,
    topRep,
    topLeak: topLeak ? { leadName: topLeak.lead?.name || 'a lead', reason: topLeak.reason } : null,
    url: `${baseUrl}/automation/leak-radar`,
  });

  let recipients = (lg.digest?.recipients || []).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (!recipients.length && business.ownerId) {
    const owner = await User.findById(business.ownerId).select('email').lean();
    if (owner?.email) recipients = [owner.email];
  }
  if (!recipients.length) return { businessId: String(bizId), skipped: 'no recipient' };

  const result = await sendInternalEmail(business, { to: recipients.join(', '), subject: content.subject, html: content.html, text: content.text });
  if (result?.success === false) return { businessId: String(bizId), error: result.error || 'send failed' };

  await Business.updateOne({ _id: bizId }, { $set: { 'settings.leakGuard.digest.lastSentAt': now } });
  return { businessId: String(bizId), sent: recipients.length };
}

/**
 * Send from the business's legacy SMTP when it's set up, otherwise from the
 * owner's default mailbox, otherwise any active mailbox of the business.
 */
async function sendInternalEmail(business, mail) {
  if (business.integrationCredentials?.email?.enabled) return sendBusinessEmail(business, mail);
  const active = { businessId: business._id, status: 'active' };
  const account = (business.ownerId && await EmailAccount.findOne({ ...active, userId: business.ownerId, isDefault: true }))
    || await EmailAccount.findOne(active).sort({ isDefault: -1, createdAt: 1 });
  if (!account) return { success: false, error: 'No mailbox connected to send the brief from' };
  try {
    const transporter = await createTransporterForAccount(account);
    const info = await transporter.sendMail({ from: formatFromHeader(account), ...mail });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Cron entry: every business due its brief today. */
export async function sendDueDigests({ now = new Date(), timeBudgetMs = 45000 } = {}) {
  const started = Date.now();
  const candidates = await Business.find({
    'settings.leakGuard.enabled': true,
    'settings.leakGuard.digest.enabled': { $ne: false },
    frozen: { $ne: true },
  }).select('businessName ownerId settings.leakGuard integrationCredentials.email').limit(500);

  const results = [];
  for (const b of candidates) {
    if (Date.now() - started > timeBudgetMs) break;
    const lg = b.settings?.leakGuard || {};
    if (!digestDueToday(lg.digest?.lastSentAt, now, lg.businessHours?.tzOffsetMinutes ?? 330)) continue;
    try {
      results.push(await sendBusinessDigest(b, now));
    } catch (err) {
      console.error(`[leak-digest] ${b._id}`, err);
      results.push({ businessId: String(b._id), error: err.message });
    }
  }
  return { candidates: candidates.length, results };
}
