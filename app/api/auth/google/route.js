import { NextResponse } from 'next/server';
import { getGoogleAuthUrl, getGoogleClientId, getGoogleClientSecret } from '@/lib/auth/googleOAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google?mode=login|register
 * Redirects to Google OAuth consent screen.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';

    if (!getGoogleClientId() || !getGoogleClientSecret()) {
      const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const dest = mode === 'register' ? 'register' : 'login';
      return NextResponse.redirect(`${base}/${dest}?error=google_config`);
    }

    // Random nonce bound to the browser via httpOnly cookie (login CSRF protection)
    const nonce = globalThis.crypto.randomUUID();
    const state = `${mode}:0:${nonce}`; // middle part kept so the callback's state format is unchanged

    const url = getGoogleAuthUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set('g_oauth_state', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('[Google OAuth] start error:', error);
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    return NextResponse.redirect(`${base}/login?error=google_config`);
  }
}
