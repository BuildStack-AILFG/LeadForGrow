import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { listInstagramMedia } from '@/lib/instagram/send';
import { listFacebookPosts } from '@/lib/facebook/send';

// Meta error codes meaning "token/permission problem" rather than a transient failure.
const RECONNECT_CODES = new Set([3, 10, 190, 200]);

/**
 * GET ?channel=instagram|facebook — the account's recent posts/reels, so a
 * comment automation can be attached to one by clicking a thumbnail.
 */
export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const channel = new URL(req.url).searchParams.get('channel');
    const list = channel === 'facebook' ? listFacebookPosts : channel === 'instagram' ? listInstagramMedia : null;
    if (!list) return NextResponse.json({ success: false, error: 'channel must be instagram or facebook' }, { status: 400 });

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const result = await list(business, { limit: 24 });
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        needsReconnect: RECONNECT_CODES.has(result.code),
      });
    }
    return NextResponse.json({ success: true, data: { posts: result.posts } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
