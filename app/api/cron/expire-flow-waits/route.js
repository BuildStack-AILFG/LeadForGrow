import { NextResponse } from 'next/server';
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

    // Find all waits that have timed out
    const result = await FlowExecution.updateMany(
      {
        status: 'waiting',
        'wait.type': 'reply',
        'wait.until': { $exists: true, $lt: now },
      },
      {
        $set: {
          status: 'failed',
          error: 'Wait for reply timeout exceeded',
          completedAt: now,
          'wait.type': null,
        },
      }
    );

    console.log(`[Cron] Expired ${result.modifiedCount} timed-out flow waits`);

    return NextResponse.json({
      success: true,
      expired: result.modifiedCount,
    });
  } catch (error) {
    console.error('[Cron] Expire flow waits error:', error);
    return NextResponse.json({ error: serverErrorMessage(error) }, { status: 500 });
  }
};
