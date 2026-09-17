import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import RealtimeEvent from '@/models/RealtimeEvent';

export const dynamic = 'force-dynamic';

/**
 * GET /api/realtime/poll?since=<ms>&token=<jwt>
 *
 * Serverless-friendly replacement for the held-open SSE stream. The client
 * polls this every few seconds; it returns any events for the tenant newer
 * than `since`, plus `now` (which the client sends back as the next `since`).
 * Each call is a short invocation — no function stays open, so it can't burn
 * Fluid CPU/memory the way the SSE connection did.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const token =
    url.searchParams.get('token') ||
    req.headers.get('authorization')?.replace('Bearer ', '') ||
    req.cookies.get('token')?.value;

  const user = token ? verifyToken(token) : null;
  if (!user?.businessId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = Date.now();
  // First poll (no `since`) only looks back a few seconds so a freshly-opened
  // tab doesn't replay a burst of old events.
  const since = Number(url.searchParams.get('since')) || now - 10000;

  await dbConnect();
  const events = await RealtimeEvent.find({
    businessId: user.businessId,
    ts: { $gt: since },
  })
    .sort({ ts: 1 })
    .limit(200)
    .lean();

  return new Response(
    JSON.stringify({
      events: events.map((e) => ({ type: e.type, data: e.data, ts: e.ts })),
      now,
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
}
