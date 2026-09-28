import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { scanDueBusinesses } from '@/lib/leak/scanner';

export const maxDuration = 60;

function authorize(request) {
  if (!process.env.CRON_SECRET) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * GET /api/cron/leak-scan — every 15 minutes.
 * Scans businesses with Leak Radar on, least recently scanned first, within a
 * time budget; whatever doesn't fit is picked up first on the next run.
 */
export async function GET(request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await dbConnect();
    const result = await scanDueBusinesses({ timeBudgetMs: 45000 });
    return NextResponse.json({ success: true, due: result.due, scanned: result.scanned, results: result.results });
  } catch (error) {
    console.error('[Cron:LeakScan]', error);
    return NextResponse.json({ success: false, error: 'Leak scan failed' }, { status: 500 });
  }
}
