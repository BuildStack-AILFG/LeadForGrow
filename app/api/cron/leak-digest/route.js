import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { sendDueDigests } from '@/lib/leak/digest';

export const maxDuration = 60;

function authorize(request) {
  if (!process.env.CRON_SECRET) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * GET /api/cron/leak-digest — hourly is fine.
 * Sends each Leak Radar business its daily brief once, after 08:00 local time.
 */
export async function GET(request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await dbConnect();
    const result = await sendDueDigests({ timeBudgetMs: 45000 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron:LeakDigest]', error);
    return NextResponse.json({ success: false, error: 'Leak digest failed' }, { status: 500 });
  }
}
