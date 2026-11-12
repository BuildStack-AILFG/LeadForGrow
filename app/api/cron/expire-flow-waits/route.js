import { NextResponse } from 'next/server';
import { expireFlowWaits } from '@/lib/whatsappFlows/engine';
import { dbConnect } from '@/lib/mongodb';
import FlowExecution from '@/models/automation/FlowExecution';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = async (request) => {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const now = new Date();

    // Timed-out reply waits: follow the flow's "timeout" branch if it has one, else end.
    const result = await expireFlowWaits(200);
    console.log(`[Cron] Flow waits: ${result.continued} continued on timeout, ${result.expired} expired`);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] Expire flow waits error:', error);
    return NextResponse.json({ error: serverErrorMessage(error) }, { status: 500 });
  }
};
