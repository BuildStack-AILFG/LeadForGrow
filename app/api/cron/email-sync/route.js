import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { syncEmailAccount } from '@/lib/omnichannel/emailSync';
import { runScheduledEmailSends } from '@/lib/omnichannel/scheduledEmailSender';

/**
 * GET /api/cron/email-sync
 * Scheduled every 5 minutes (via Vercel cron / external scheduler).
 * Iterates every syncable EmailAccount and pulls new IMAP messages.
 *
 * Auth: CRON_SECRET in Authorization: Bearer <secret> OR ?secret= query param.
 * In development (no CRON_SECRET set), auth is bypassed for convenience;
 * production requires the secret to prevent public triggering.
 *
 * Response includes per-account results so a monitoring dashboard can
 * spot broken accounts without tailing logs.
 */
export async function GET(req) {
  const configured = process.env.CRON_SECRET;

  if (configured) {
    const authHeader = req.headers.get('authorization');
    const legacySecret =
      req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (
      authHeader !== `Bearer ${configured}` &&
      legacySecret !== configured
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Refuse to run unauthenticated in production even if someone forgot
    // to set the env var — better to 503 than silently expose the cron.
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET not configured' },
      { status: 503 }
    );
  }

  const startedAt = Date.now();

  try {
    await dbConnect();

    const accounts = await EmailAccount.find({
      syncEnabled: true,
      status: { $nin: ['archived', 'disconnected'] },
      // Only providers we know how to sync via IMAP. Gmail App-Password
      // connections show up with provider='gmail'.
      provider: { $in: ['gmail', 'smtp', 'imap', 'outlook'] },
      'imap.host': { $exists: true, $ne: null },
    }).limit(200);

    const results = [];
    for (const account of accounts) {
      const perAccountStart = Date.now();
      // Sequential for now — 2 users, low volume. When mailboxes scale into
      // the hundreds, promote to a concurrent worker with a per-account lock.
      const r = await syncEmailAccount(account);
      results.push({
        accountId: String(account._id),
        email: account.email,
        durationMs: Date.now() - perAccountStart,
        ...r,
      });
    }

    // Flush any due scheduled emails on the same tick, so scheduled-send works
    // out of the box off the existing 5-min cron with no extra scheduler.
    // Safe to also run from /api/cron/scheduled-email — the atomic claim in
    // the sender means overlapping runs can't double-send. Isolated so a
    // scheduled-send failure never fails the IMAP sync.
    let scheduledEmail = null;
    try {
      scheduledEmail = await runScheduledEmailSends();
    } catch (err) {
      console.error('[Cron:email-sync] scheduled-email flush failed', err);
      scheduledEmail = { error: err.message };
    }

    return NextResponse.json({
      success: true,
      totalAccounts: accounts.length,
      totalSynced: results.reduce((n, r) => n + (r.synced || 0), 0),
      durationMs: Date.now() - startedAt,
      results,
      scheduledEmail,
    });
  } catch (error) {
    console.error('[Cron:email-sync]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
