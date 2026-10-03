import { NextResponse } from 'next/server';
import { scanAllBusinessesNoReply } from '@/lib/automation/noReplyScanner';
import { serverErrorMessage } from '@/lib/api/serverError';

function authorize(request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return process.env.NODE_ENV !== 'production';
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await scanAllBusinessesNoReply();
    const triggered = results.reduce((n, r) => n + (r.triggered || 0), 0);
    return NextResponse.json({ success: true, businesses: results.length, triggered, results });
  } catch (error) {
    console.error('[Cron:NoReply]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}
