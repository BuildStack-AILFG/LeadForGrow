import IORedis from 'ioredis';
import { NextResponse } from 'next/server';

const REDIS_URL = process.env.REDIS_URL;
const redis = REDIS_URL ? new IORedis(REDIS_URL) : null;

if (redis) {
    redis.on('error', (err) => {
        console.error('[RateLimit] Redis connection error:', err.message);
    });
}

/** Window number for a fixed window of `window` seconds. */
export function windowIndex(window, now = Date.now()) {
    return Math.floor(now / (window * 1000));
}

/**
 * Client IP from proxy headers. x-forwarded-for is "client, proxy1, proxy2" — the first
 * entry is the client (Vercel sets it); using the whole string would give every proxy
 * hop its own bucket.
 */
export function clientIp(req) {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    return req.headers.get('x-real-ip') || '127.0.0.1';
}

async function countRedis(key, window) {
    const multi = redis.multi();
    multi.incr(key);
    // The window number is part of the key, so a new window always starts at zero —
    // the old key-per-client version re-set the expiry on every hit and a busy client's
    // window never closed. Expiry here is only cleanup.
    multi.expire(key, window * 2);
    const [[, count]] = await multi.exec();
    return count;
}

async function countMongo(key, window) {
    const [{ dbConnect }, { default: RateLimitCounter }] = await Promise.all([
        import('./mongodb.js'),
        import('../models/RateLimitCounter.js'),
    ]);
    await dbConnect();
    const doc = await RateLimitCounter.findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + window * 2000) } },
        { upsert: true, new: true, lean: true }
    );
    return doc.count;
}

/**
 * Fixed-window rate limiter. Uses Redis when REDIS_URL is set, otherwise an atomic
 * MongoDB counter — so limits hold in every deployment (before, no Redis meant no
 * limits at all). Fails open on store errors so an outage never locks users out.
 *
 * @param {string} id - Unique identifier, already namespaced (e.g. "login:1.2.3.4")
 * @param {number} limit - Max requests per window
 * @param {number} window - Window length in seconds
 */
export async function rateLimit(id, limit, window) {
    const key = `rate_limit:${id}:${windowIndex(window)}`;
    try {
        const current = redis ? await countRedis(key, window) : await countMongo(key, window);
        return { success: current <= limit, current, limit, remaining: Math.max(0, limit - current) };
    } catch (error) {
        console.error('[RateLimit] store error:', error.message);
        return { success: true, current: 0, limit, remaining: limit };
    }
}

/**
 * Route wrapper. Each route gets its own bucket (path + client IP), so traffic on one
 * endpoint never uses up another endpoint's allowance.
 */
export function withRateLimit(limit, window, handler) {
    return async (req, ...args) => {
        let path = 'route';
        try { path = new URL(req.url).pathname; } catch { /* keep default */ }

        const { success, remaining } = await rateLimit(`${path}:${clientIp(req)}`, limit, window);

        if (!success) {
            const retryAfter = window;
            return NextResponse.json({
                success: false,
                error: `Too many requests. Please try again in about ${retryAfter} seconds.`,
                retryAfter,
            }, {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': retryAfter.toString(),
                }
            });
        }

        const response = await handler(req, ...args);

        if (response instanceof NextResponse) {
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
        }

        return response;
    };
}
