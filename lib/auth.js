import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server.js';
import { requireEnv } from './env.js';

const JWT_EXPIRES_IN = '7d';

function getJwtSecret() {
  return requireEnv('JWT_SECRET');
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(user, options = {}) {
  return jwt.sign(
    {
      userId: user._id?.toString?.() || user._id,
      businessId: user.businessId?.toString?.() || user.businessId,
      agencyId: user.agencyId?.toString?.() || user.agencyId || null,
      role: user.role,
      plan: options.plan || user.plan || 'free',
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Plan + quotas per business, cached briefly in this process. Every
 * authenticated API call used to spend one extra database round trip here.
 * A plan change shows up within PLAN_CACHE_TTL_MS (immediately in the process
 * that calls invalidateBusinessPlanCache).
 */
const PLAN_CACHE_TTL_MS = 15 * 1000;
const PLAN_CACHE_MAX = 5000;
const planCache = new Map(); // businessId -> { at, plan, quotas }

export function invalidateBusinessPlanCache(businessId) {
  if (businessId) planCache.delete(String(businessId));
}

/**
 * Resolve live plan + quotas from Business (JWT plan can be stale).
 */
export async function enrichUserContext(userContext) {
  if (!userContext?.businessId) return userContext;

  const cacheKey = String(userContext.businessId);
  const hit = planCache.get(cacheKey);
  if (hit && Date.now() - hit.at < PLAN_CACHE_TTL_MS) {
    userContext.plan = hit.plan;
    userContext.quotas = hit.quotas;
    return userContext;
  }

  try {
    const { dbConnect } = await import('./mongodb');
    const Business = (await import('../models/Business')).default;
    await dbConnect();

    const business = await Business.findById(userContext.businessId)
      .select('plan quotas')
      .lean();

    if (business) {
      userContext.plan = business.plan || 'free';
      userContext.quotas = business.quotas;
      if (planCache.size >= PLAN_CACHE_MAX) planCache.delete(planCache.keys().next().value);
      planCache.set(cacheKey, { at: Date.now(), plan: userContext.plan, quotas: userContext.quotas });
    }
  } catch (err) {
    console.warn('[Auth] enrichUserContext failed:', err.message);
  }

  return userContext;
}

/**
 * Verify a JWT token. Returns null if invalid.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

/**
 * Extract bearer token or cookie token from request.
 */
export function extractToken(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    return cookies.token || cookies.userToken || null;
  }

  return null;
}

/**
 * Reject legacy spoofable auth headers/params.
 */
export function rejectLegacyAuth(req) {
  const userIdHeader = req.headers.get('x-user-id');
  if (userIdHeader) {
    return NextResponse.json(
      {
        success: false,
        error: 'Legacy x-user-id authentication is no longer supported. Use Bearer JWT.',
        code: 'LEGACY_AUTH_REJECTED',
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get('userId')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Query-param authentication is no longer supported. Use Bearer JWT.',
        code: 'LEGACY_AUTH_REJECTED',
      },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Middleware for protecting API routes and enforcing RBAC.
 * JWT-only — no query-param or header spoofing fallbacks.
 */
export function withAuth(roles = []) {
  return (handler) => async (req, ...args) => {
    try {
      const legacyReject = rejectLegacyAuth(req);
      if (legacyReject) return legacyReject;

      const token = extractToken(req);
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: `Authentication required: ${new URL(req.url).pathname}`,
            code: 'AUTH_REQUIRED',
          },
          { status: 401 }
        );
      }

      let userContext = verifyToken(token);
      if (!userContext) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token', code: 'TOKEN_INVALID' },
          { status: 401 }
        );
      }

      userContext = await enrichUserContext(userContext);

      if (roles.length > 0 && !roles.includes(userContext.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied: Insufficient permissions', code: 'ROLE_DENIED' },
          { status: 403 }
        );
      }

      req.user = userContext;
      return handler(req, ...args);
    } catch (error) {
      console.error('[Auth Middleware] Error:', error);
      return NextResponse.json({ success: false, error: 'Internal auth error' }, { status: 500 });
    }
  };
}

/**
 * Require authenticated user with a business workspace (tenant isolation).
 */
export function withTenantAuth(handler) {
  return withAuth()(async (req, ...args) => {
    if (!req.user?.businessId) {
      return NextResponse.json(
        { success: false, error: 'No business workspace associated with this account', code: 'NO_TENANT' },
        { status: 403 }
      );
    }
    return handler(req, ...args);
  });
}

/**
 * Resolve full user + business documents for tenant-scoped routes.
 */
export async function resolveTenant(req) {
  const { dbConnect } = await import('./mongodb');
  const User = (await import('../models/User')).default;
  const Business = (await import('../models/Business')).default;

  await dbConnect();

  // User and business in one round trip instead of two. The JWT's businessId
  // is only used to start the read early; the user's own businessId stays
  // authoritative, and a mismatch still ends in the 403 below.
  const jwtBusinessId = req.user.businessId;
  const [user, guessedBusiness] = await Promise.all([
    User.findById(req.user.userId),
    jwtBusinessId ? Business.findById(jwtBusinessId) : null,
  ]);
  if (!user) {
    return { error: 'User not found', status: 404 };
  }

  const business = guessedBusiness && String(guessedBusiness._id) === String(user.businessId)
    ? guessedBusiness
    : await Business.findById(user.businessId);
  if (!business) {
    return { error: 'Business not found', status: 404 };
  }

  // Enforce tenant boundary — JWT businessId must match user's business
  if (req.user.businessId && user.businessId?.toString() !== req.user.businessId?.toString()) {
    return { error: 'Tenant mismatch — access denied', status: 403 };
  }

  return { user, business };
}

export function getUser(req) {
  return req.user;
}
