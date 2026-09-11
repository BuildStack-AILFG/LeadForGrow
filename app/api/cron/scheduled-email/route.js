import { NextResponse } from 'next/server';
import { runScheduledEmailSends } from '@/lib/omnichannel/scheduledEmailSender';

/**
 * GET /api/cron/scheduled-email
 * Sends every EmailDraft whose scheduledAt has arrived. Point an external
 * scheduler (cron-job.org / Vercel cron) at this every 1–5 minutes; the
 * granularity of that interval is the worst-case delay on a scheduled send.
 *
 * Auth mirrors /api/cron/email-sync: CRON_SECRET as `Authorization: Bearer
 * <secret>`, `x-cron-secret`, or `?secret=`. Dev without CRON_SECRET is open
 * for convenience; production refuses to run unauthenticated.
 */
export async function GET(req) {
  const configured = process.env.CRON_SECRET;

  if (configured) {
    const authHeader = req.headers.get('authorization');
    const legacySecret =
      req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (authHeader !== `Bearer ${configured}` && legacySecret !== configured) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET not configured' },
      { status: 503 },
    );
  }

  const startedAt = Date.now();
  try {
    const result = await runScheduledEmailSends();
    return NextResponse.json({ success: true, durationMs: Date.now() - startedAt, ...result });
  } catch (error) {
    console.error('[Cron:scheduled-email]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
