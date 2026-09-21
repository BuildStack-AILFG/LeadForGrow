/**
 * Database side of the inbox queues (see inboxViews.js): loads the lead lists a view needs and counts each queue.
 * Shared by the conversations list route (?view=) and the counts route, so a tab's number and its list always agree.
 */
import Conversation from '@/models/omnichannel/Conversation';
import Lead from '@/models/automation/Lead';
import { SERVER_VIEWS, leadListsNeeded, viewClauses } from './inboxViews';

const MAX_LEAD_IDS = 20000;

/** Conversations that are visible in the inbox at all (not archived / spam / deleted). */
export const baseInboxFilter = (businessId) => ({
  businessId,
  isArchived: { $ne: true },
  isSpam: { $ne: true },
  isDeleted: { $ne: true },
});

/** Snoozed conversations come back when the snooze is over. */
export const notSnoozedClause = () => ({
  $or: [{ snoozedUntil: null }, { snoozedUntil: { $exists: false } }, { snoozedUntil: { $lte: new Date() } }],
});

/** Everything viewClauses needs for this view: the user id, plus the lead-id lists only for views that use them. */
export async function loadViewInputs({ businessId, userId, view }) {
  const need = leadListsNeeded(view);
  const inputs = { userId };
  if (need.mine) {
    const rows = await Lead.find({ businessId, assignedTo: userId }).select('_id').limit(MAX_LEAD_IDS).lean();
    inputs.myLeadIds = rows.map((l) => l._id);
  }
  if (need.existing) {
    // Beyond the cap the check is skipped (never hide real conversations of a very large business).
    const rows = await Lead.find({ businessId }).select('_id').limit(MAX_LEAD_IDS + 1).lean();
    if (rows.length <= MAX_LEAD_IDS) inputs.existingLeadIds = rows.map((l) => l._id);
  }
  if (need.unassigned) {
    const rows = await Lead.find({ businessId, assignedTo: null }).select('_id').limit(MAX_LEAD_IDS).lean();
    inputs.unassignedLeadIds = rows.map((l) => l._id);
  }
  return inputs;
}

/** { needs_reply, mine, unassigned, taken_over, unread }: the numbers shown on the tabs. */
export async function countInboxQueues({ businessId, userId }) {
  const base = baseInboxFilter(businessId);
  const snooze = notSnoozedClause();
  const counts = {};
  await Promise.all([
    ...SERVER_VIEWS.map(async (view) => {
      const inputs = await loadViewInputs({ businessId, userId, view });
      const { clauses } = viewClauses(view, inputs);
      counts[view] = await Conversation.countDocuments({ ...base, $and: [snooze, ...clauses] });
    }),
    (async () => {
      counts.unread = await Conversation.countDocuments({ ...base, $and: [snooze], inboxStatus: 'unread' });
    })(),
  ]);
  return counts;
}
