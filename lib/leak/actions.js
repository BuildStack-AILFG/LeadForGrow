/**
 * Record a Leak Radar action and move the flag (server side).
 *
 * Idempotent: the key is unique per business, so a double tap or a retried
 * request records once. The flag update is conditional on its version, so two
 * people acting at once can't both win; the loser gets the current flag back.
 */
import LeakFlag from '@/models/leak/LeakFlag';
import LeakAction from '@/models/leak/LeakAction';
import Activity from '@/models/automation/Activity';
import Lead from '@/models/automation/Lead';
import { canActOnFlag, flagUpdateFor } from '@/lib/leak/actionRules';

export class LeakActionError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function recordLeakAction({ businessId, user, flagId, input, now = new Date() }) {
  const idempotencyKey = `${businessId}:${input.idempotencyKey}`;

  const previous = await LeakAction.findOne({ idempotencyKey }).lean();
  if (previous) {
    return { duplicate: true, action: previous, flag: await LeakFlag.findOne({ _id: previous.flagId, businessId }).lean() };
  }

  const flag = await LeakFlag.findOne({ _id: flagId, businessId }).lean();
  if (!flag) throw new LeakActionError('Leak not found', 404);
  if (!canActOnFlag(user, flag)) throw new LeakActionError('This leak belongs to someone else', 403);

  let action;
  try {
    action = await LeakAction.create({
      businessId,
      flagId: flag._id,
      leadId: flag.leadId,
      actionType: input.actionType,
      actorType: 'user',
      actorId: user.userId,
      externalMessageId: input.externalMessageId,
      note: input.note || undefined,
      meta: {
        ...(input.snoozeHours ? { snoozeHours: input.snoozeHours } : {}),
        ...(input.assignedTo ? { assignedTo: input.assignedTo, previousAssignee: flag.assignedTo || null } : {}),
        rule: flag.rule,
        statusBefore: flag.status,
      },
      idempotencyKey,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const again = await LeakAction.findOne({ idempotencyKey }).lean();
      return { duplicate: true, action: again, flag };
    }
    throw err;
  }

  let current = flag;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const update = flagUpdateFor(current, input, now);
    if (!update) break;
    const updated = await LeakFlag.findOneAndUpdate({ _id: current._id, version: current.version }, update, { new: true }).lean();
    if (updated) { current = updated; break; }
    current = await LeakFlag.findById(flag._id).lean(); // changed under us (e.g. the reply hook); re-apply once
    if (!current) break;
  }

  if (input.actionType === 'worked_outside') {
    // Put it on the lead's timeline so the next person sees it happened.
    await Promise.all([
      Activity.create({
        businessId,
        leadId: flag.leadId,
        entityType: 'lead',
        entityId: flag.leadId,
        type: 'note_added',
        description: `Worked outside the CRM${input.note ? `: ${input.note}` : ''}`,
        performedBy: user.userId,
        performedAt: now,
        metadata: { source: 'leak_radar', flagId: flag._id },
      }),
      Lead.updateOne({ _id: flag.leadId, businessId }, { $set: { lastContactedAt: now } }),
    ]);
  }

  return { duplicate: false, action: action.toObject(), flag: current };
}
