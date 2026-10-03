import mongoose from 'mongoose';
import User from '@/models/User';
import { leakRoute, ok, bad } from '@/lib/leak/api';
import { parseActionInput } from '@/lib/leak/actionRules';
import { recordLeakAction } from '@/lib/leak/actions';

/**
 * POST /api/automation/leak/flags/:id/actions
 * { actionType, idempotencyKey, note?, snoozeHours?, assignedTo?, externalMessageId? }
 *
 * Records what was done about a leak and moves the flag. Sending a message,
 * reassigning, creating a task or changing the stage happen first through the
 * CRM's existing APIs; this call records them (and is safe to retry).
 */
export const POST = leakRoute(async (req, { params }, { businessId }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return bad('Leak not found', 404);
  const parsed = parseActionInput(await req.json().catch(() => ({})));
  if (parsed.error) return bad(parsed.error);
  if (parsed.value.assignedTo) {
    const teammate = await User.exists({ _id: parsed.value.assignedTo, businessId });
    if (!teammate) return bad('Pick someone from your team');
  }

  const result = await recordLeakAction({ businessId, user: req.user, flagId: id, input: parsed.value });
  return ok({
    duplicate: result.duplicate,
    flag: result.flag && {
      id: String(result.flag._id),
      status: result.flag.status,
      resolution: result.flag.resolution || null,
      snoozedUntil: result.flag.snoozedUntil || null,
      actionedAt: result.flag.actionedAt || null,
    },
  });
});
