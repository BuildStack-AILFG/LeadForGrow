import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPermissions } from '@/lib/rbac';
import { decryptMaybe } from '@/lib/encryption';

/**
 * GET /api/automation/inbox/social-post?channel=instagram|facebook&id=<mediaOrPostId>
 * Fetches a single post's caption + thumbnail + permalink so a comment
 * conversation can show WHICH post it came from (the post-context card).
 */
async function handler(req) {
  try {
    const { user } = req;
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const id = searchParams.get('id');
    if (!id || !['instagram', 'facebook'].includes(channel)) {
      return NextResponse.json({ success: false, error: 'channel and id are required' }, { status: 400 });
    }

    await dbConnect();
    const business = await Business.findById(user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const creds = business.integrationCredentials || {};
    let post = null;

    if (channel === 'instagram') {
      const token = decryptMaybe(creds.instagram?.accessToken || creds.facebookAds?.accessToken);
      if (!token) return NextResponse.json({ success: false, error: 'Instagram not connected' }, { status: 400 });
      const url = `https://graph.instagram.com/v21.0/${id}?fields=permalink,caption,media_type,media_url,thumbnail_url&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ success: false, error: data.error?.message || 'Could not load post' }, { status: 200 });
      post = {
        caption: data.caption || '',
        thumbnail: data.thumbnail_url || (data.media_type !== 'VIDEO' ? data.media_url : null) || null,
        permalink: data.permalink || null,
      };
    } else {
      const token = decryptMaybe(creds.facebook?.accessToken || creds.facebookAds?.accessToken || creds.facebookAds?.pageAccessToken);
      if (!token) return NextResponse.json({ success: false, error: 'Facebook not connected' }, { status: 400 });
      const url = `https://graph.facebook.com/v21.0/${id}?fields=permalink_url,message,full_picture&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ success: false, error: data.error?.message || 'Could not load post' }, { status: 200 });
      post = {
        caption: data.message || '',
        thumbnail: data.full_picture || null,
        permalink: data.permalink_url || null,
      };
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('[Inbox API] social-post:', error);
    return NextResponse.json({ success: false, error: 'Failed to load post' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
