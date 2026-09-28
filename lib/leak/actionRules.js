/**
 * What each Leak Radar action does to a flag (pure — unit tested).
 *
 * Side effects that already have a home (sending a message, reassigning,
 * creating a task, changing the lead's stage) run through the existing APIs
 * first; the action is then recorded here, so a reassign from Leak Radar
 * behaves exactly like a reassign anywhere else in the CRM.
 */
import { isManagerRole } from '../omnichannel/inboxViews.js';

export const ACTION_TYPES = ['message_sent', 'task_created', 'reassigned', 'worked_outside', 'snoozed', 'marked_unqualified', 'dismissed'];
const CLOSED = ['resolved', 'dismissed', 'expired'];
const MAX_SNOOZE_HOURS = 168;

/** Managers act on any leak; a salesperson on the leaks assigned to them. */
export function canActOnFlag(user, flag) {
  if (!user || !flag) return false;
  if (isManagerRole(user.role)) return true;
  return Boolean(flag.assignedTo) && String(flag.assignedTo) === String(user.userId);
}

/** Validate the request body; returns { error } or { value }. */
export function parseActionInput(body = {}) {
  const actionType = String(body.actionType || '');
  if (!ACTION_TYPES.includes(actionType)) return { error: 'Unknown action' };
  const key = String(body.idempotencyKey || '');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(key)) return { error: 'idempotencyKey required' };
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
  if ((actionType === 'dismissed' || actionType === 'marked_unqualified' || actionType === 'snoozed') && !note) {
    return { error: 'Add a short reason' };
  }
  const value = { actionType, idempotencyKey: key, note };
  if (actionType === 'snoozed') {
    const h = Number(body.snoozeHours);
    if (!Number.isFinite(h) || h <= 0) return { error: 'snoozeHours required' };
    value.snoozeHours = Math.min(MAX_SNOOZE_HOURS, h);
  }
  if (actionType === 'reassigned') {
    if (!/^[a-f0-9]{24}$/i.test(String(body.assignedTo || ''))) return { error: 'assignedTo required' };
    value.assignedTo = String(body.assignedTo);
  }
  if (body.externalMessageId) value.externalMessageId = String(body.externalMessageId).slice(0, 200);
  return { value };
}

/**
 * The flag update for an action, or null when the flag should not change.
 * A flag already closed (e.g. the reply hook resolved it a moment before the
 * "message sent" record arrives) only gains actionedAt.
 */
export function flagUpdateFor(flag, input, now = new Date()) {
  const actionedAt = flag.actionedAt || now;
  if (CLOSED.includes(flag.status)) {
    return ['message_sent', 'task_created', 'reassigned'].includes(input.actionType) && !flag.actionedAt
      ? { $set: { actionedAt }, $inc: { version: 1 } }
      : null;
  }
  switch (input.actionType) {
    case 'message_sent':
    case 'task_created':
      return { $set: { status: 'actioned', actionedAt, snoozedUntil: null }, $inc: { version: 1 } };
    case 'reassigned':
      return { $set: { status: 'actioned', actionedAt, assignedTo: input.assignedTo, snoozedUntil: null }, $inc: { version: 1 } };
    case 'worked_outside':
      return { $set: { status: 'resolved', resolution: 'worked_outside', resolutionNote: input.note || undefined, resolvedAt: now, actionedAt }, $inc: { version: 1 } };
    case 'marked_unqualified':
      return { $set: { status: 'resolved', resolution: 'unqualified', resolutionNote: input.note, resolvedAt: now, actionedAt }, $inc: { version: 1 } };
    case 'dismissed':
      return { $set: { status: 'dismissed', resolution: 'not_a_leak', resolutionNote: input.note, resolvedAt: now }, $inc: { version: 1 } };
    case 'snoozed':
      return { $set: { snoozedUntil: new Date(now.getTime() + input.snoozeHours * 3600 * 1000) }, $inc: { version: 1 } };
    default:
      return null;
  }
}
