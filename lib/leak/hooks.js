import LeakFlag from '@/models/leak/LeakFlag';

/**
 * A person replied to this lead: its "never contacted" (R1) and "customer
 * waiting" (R2) leaks are over, so the queue updates now rather than at the
 * next scan. One indexed write; a no-op for businesses without Leak Radar.
 */
export async function resolveLeaksOnHumanReply({ businessId, leadId, at = new Date() }) {
  if (!businessId || !leadId) return;
  try {
    await LeakFlag.updateMany(
      { businessId, leadId, rule: { $in: ['R1', 'R2'] }, status: { $in: ['open', 'actioned'] } },
      { $set: { status: 'resolved', resolution: 'replied', resolvedAt: at }, $inc: { version: 1 } }
    );
  } catch (err) {
    console.error('[leak] resolve on reply failed:', err.message);
  }
}
