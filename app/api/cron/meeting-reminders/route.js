import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { processPendingReminders } from '@/lib/meetings/reminders';
import { serverErrorMessage } from '@/lib/api/serverError';

export async function GET(req) {
  const configured = process.env.CRON_SECRET;
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'CRON_SECRET not configured' }, { status: 503 });
    }
  } else {
    const authHeader = req.headers.get('authorization');
    const legacySecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (authHeader !== `Bearer ${configured}` && legacySecret !== configured) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await dbConnect();
    const results = await processPendingReminders(100);
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('[Meeting Reminders Cron]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}
