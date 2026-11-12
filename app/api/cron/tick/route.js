import { NextResponse } from 'next/server';
import { runTick } from '@/lib/jobs/tick';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/tick — runs whatever is due (delayed sequence steps, flow delays and
 * reply timeouts, meeting reminders, scheduled emails). Called every 5 minutes by
 * .github/workflows/scheduler.yml; any other scheduler can call it too.
 *
 * No secret needed on purpose: it only runs work that is already due, takes a global
 * lock (at most once per ~50 s), and every task claims its rows atomically — calling it
 * more often can't make anything run twice or early. `?force=1` (skip the lock) needs CRON_SECRET.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1'
    && !!process.env.CRON_SECRET
    && request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
  try {
    const result = await runTick({ force });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron:tick]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}

export const POST = GET;
