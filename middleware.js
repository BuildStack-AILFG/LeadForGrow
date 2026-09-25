import { NextResponse } from 'next/server';

/** Public API routes — no JWT required */
const PUBLIC_API_PREFIXES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/google',
  '/api/forms/submit',
  '/api/forms/public',
  '/api/forms/config',
  '/api/consent/log',
  '/api/consent/track',
  '/api/meetings/public',
  '/api/meetings/book',
  '/api/webhooks/',
  '/api/public/',
  '/api/cron/',
  '/api/website-funnel/leads', // public lead capture from published funnel sites (validated in handler)
];

/**
 * Inbound webhook receivers that live under a protected prefix. Callers are
 * outside services with no JWT; each handler checks its own secret or token.
 * Exact shapes only, so the management routes next to them stay protected.
 */
const PUBLIC_API_PATTERNS = [
  /^\/api\/integrations\/webhooks\/[^/]+\/?$/,                 // Business.webhookSecret, or interakt-reply (per-business token)
  /^\/api\/automation\/webhooks\/[^/]+\/[^/]+\/?$/,            // workflow id + secret
  /^\/api\/automation\/whatsapp-flows\/webhook\/[^/]+\/?$/,    // WhatsAppFlow.webhookSecret
];

/** Protected API prefixes — JWT required */
const PROTECTED_API_PREFIXES = [
  '/api/automation/',
  '/api/agency/',
  '/api/integrations/',
  '/api/business/',
  '/api/billing/',
  '/api/admin/',
  '/api/onboarding/',
  '/api/forms',
  '/api/ai/',
  '/api/clients/',
  '/api/websites',
  '/api/upload',
  '/api/cloudinary-sign',
  '/api/auth/me',
  '/api/realtime/',
  '/api/access/',
  '/api/user/',
  '/api/meetings/',
  '/api/website-funnel/',
];

const PROTECTED_PAGE_PREFIXES = ['/automation', '/agency', '/lfgadmin'];

function isPublicApi(pathname) {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
    || PUBLIC_API_PATTERNS.some((re) => re.test(pathname));
}

function isProtectedApi(pathname) {
  if (isPublicApi(pathname)) return false;
  return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtectedPage(pathname) {
  return PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
}

function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  const cookieToken =
    request.cookies.get('token')?.value || request.cookies.get('userToken')?.value;
  if (cookieToken) return cookieToken;

  // EventSource cannot send Authorization headers — allow ?token= only for SSE stream
  if (request.nextUrl.pathname.startsWith('/api/realtime/')) {
    const queryToken = request.nextUrl.searchParams.get('token');
    if (queryToken) return queryToken;
  }

  return null;
}

function hasValidTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function attachSecurityHeaders(response, requestId) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (requestId) response.headers.set('X-Request-Id', requestId);
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || globalThis.crypto.randomUUID();

  if (pathname.startsWith('/api/')) {
    if (request.headers.get('x-user-id')) {
      return attachSecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: 'Legacy x-user-id authentication is no longer supported.',
            code: 'LEGACY_AUTH_REJECTED',
            requestId,
          },
          { status: 401 }
        ),
        requestId
      );
    }

    if (process.env.NODE_ENV === 'production') {
      const blocked = [
        '/api/debug-test',
        '/api/debug/',
        '/api/pupp',
        '/api/scrape',
        '/api/rag-test',
      ];
      if (blocked.some((b) => pathname.startsWith(b))) {
        return attachSecurityHeaders(
          NextResponse.json({ success: false, error: 'Not found', requestId }, { status: 404 }),
          requestId
        );
      }
    }
  }

  if (isProtectedApi(pathname) || isProtectedPage(pathname)) {
    const token = extractToken(request);
    if (!hasValidTokenFormat(token)) {
      if (isProtectedPage(pathname)) {
        const loginUrl = new URL('/user/register?mode=login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return attachSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED', requestId },
          { status: 401 }
        ),
        requestId
      );
    }
  }

  return attachSecurityHeaders(NextResponse.next(), requestId);
}

export const config = {
  matcher: ['/api/:path*', '/automation/:path*', '/agency/:path*', '/lfgadmin/:path*'],
};
