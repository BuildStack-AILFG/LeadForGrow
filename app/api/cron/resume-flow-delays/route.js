import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { resumeDueFlowDelays } from '@/lib/whatsappFlows/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = async (request) => {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const resumedCount = await resumeDueFlowDelays(100);
    console.log(`[Cron] Resumed ${resumedCount} due flow delays`);
    return NextResponse.json({ success: true, resumed: resumedCount });
  } catch (error) {
    console.error('[Cron] Resume flow delays error:', error);
    return NextResponse.json({ error: serverErrorMessage(error) }, { status: 500 });
  }
};
