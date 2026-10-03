import { processDueTasks } from "@/lib/automation/processDueTasks";
import { NextResponse } from "next/server";
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * CRON Job Handler for Automated Task Follow-ups
 * For platforms with an external scheduler (e.g. Vercel Cron), point it at this route
 * every 1-5 minutes. Self-hosted/Docker deployments don't need this route at all —
 * the worker process (workers/automation-worker.js) calls processDueTasks() directly
 * on its own interval, so due follow-ups still dispatch with no external cron configured.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'CRON_SECRET not configured' }, { status: 503 });
    }
  } else if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { processed, results } = await processDueTasks();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed,
      results
    });
  } catch (error) {
    console.error('[Cron:Tasks] Global error:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}
