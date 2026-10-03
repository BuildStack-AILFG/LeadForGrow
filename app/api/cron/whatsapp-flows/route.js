import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { resumeDueFlowDelays } from '@/lib/whatsappFlows/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * Cron endpoint to resume delayed WhatsApp flow nodes.
 * Secure with CRON_SECRET bearer token when set.
 */
export async function POST(req) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await dbConnect();
    const count = await resumeDueFlowDelays(100);
    return NextResponse.json({ success: true, resumed: count });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
}

export const GET = POST;
