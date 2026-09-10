/**
 * Realtime event hub — Redis pub/sub when available, in-process fallback.
 *
 * Init is LAZY: we defer touching Redis until the first publish/subscribe call
 * actually happens. That way a missing / broken REDIS_URL never crashes the
 * Next.js build or the module import graph — the app degrades to in-process
 * events (works fine on a single-server deploy; doesn't work cross-Function
 * on Vercel, which is why prod needs a valid REDIS_URL).
 *
 * We also mark Redis as permanently disabled after auth failures so we don't
 * spam the logs with reconnect attempts on every single event.
 */
import { EventEmitter } from 'events';
import { REALTIME_EVENTS } from './constants';

export { REALTIME_EVENTS };

const CHANNEL_PREFIX = 'lfg:realtime:';

// Pinned to globalThis, not a plain module-scope const. Next.js (Turbopack
// and webpack alike) can give the same source file a separate module
// instance per route-handler bundle — two API routes that both `import`
// this file don't reliably share one `localBus` object. globalThis is a
// true process-wide singleton that bundling boundaries can't split, so
// pub (route A) and sub (route B) land on the same EventEmitter even
// without Redis. Without this, the in-process fallback silently drops
// every event whenever publisher and subscriber are different routes —
// which is the common case (e.g. a lead-creation route publishing to the
// SSE stream route).
const localBus = globalThis.__lfgRealtimeBus || (globalThis.__lfgRealtimeBus = new EventEmitter());
localBus.setMaxListeners(200);

let redisPub = null;
let redisSub = null;
let redisReady = false;
let redisDisabled = false;   // set on WRONGPASS / permanent failure
let initPromise = null;

async function initRedisOnce() {
  if (redisReady || redisDisabled) return redisReady;
  if (initPromise) return initPromise;
  if (!process.env.REDIS_URL) {
    redisDisabled = true;
    return false;
  }

  initPromise = (async () => {
    try {
      const IORedis = (await import('ioredis')).default;
      const opts = {
        // Cap retries — a bad URL should fail fast, not thrash forever
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
        reconnectOnError: (err) => !/WRONGPASS|NOAUTH|invalid password/i.test(err?.message || ''),
        lazyConnect: false,
      };
      redisPub = new IORedis(process.env.REDIS_URL, opts);
      redisSub = new IORedis(process.env.REDIS_URL, opts);

      // Auth failures come as an 'error' event, not a rejected promise.
      // Trap them and disable Redis so we stop spamming logs on every publish.
      const disableOnAuthFail = (label) => (err) => {
        if (/WRONGPASS|NOAUTH|invalid password/i.test(err?.message || '')) {
          if (!redisDisabled) {
            console.error(`[Realtime] Redis auth failed (${label}) — check REDIS_URL. Falling back to in-process events.`);
            redisDisabled = true;
          }
          try { redisPub?.disconnect(); redisSub?.disconnect(); } catch {}
          redisPub = null;
          redisSub = null;
          redisReady = false;
        }
      };
      redisPub.on('error', disableOnAuthFail('pub'));
      redisSub.on('error', disableOnAuthFail('sub'));

      redisSub.on('message', (channel, message) => {
        const businessId = channel.replace(CHANNEL_PREFIX, '');
        try {
          localBus.emit(businessId, JSON.parse(message));
        } catch {
          /* ignore malformed */
        }
      });

      // Wait for a first successful connection before flipping ready — that
      // way subscribe() calls actually get subscribed before we return.
      await new Promise((resolve, reject) => {
        const onReady = () => { redisPub.off('error', onErr); resolve(); };
        const onErr = (e) => { redisPub.off('ready', onReady); reject(e); };
        redisPub.once('ready', onReady);
        redisPub.once('error', onErr);
      });

      redisReady = true;
      return true;
    } catch (err) {
      console.warn('[Realtime] Redis unavailable, using in-process events:', err.message);
      redisDisabled = true;
      return false;
    }
  })();
  return initPromise;
}

export async function publishEvent(businessId, event) {
  const payload = { ...event, ts: Date.now() };
  const serialized = JSON.stringify(payload);

  localBus.emit(String(businessId), payload);

  await initRedisOnce().catch(() => {});
  if (redisPub && redisReady && !redisDisabled) {
    try {
      await redisPub.publish(`${CHANNEL_PREFIX}${businessId}`, serialized);
    } catch (err) {
      console.warn('[Realtime] Redis publish failed:', err.message);
    }
  }
}

export function subscribe(businessId, handler) {
  const key = String(businessId);
  localBus.on(key, handler);

  // Fire-and-forget: kick off Redis subscribe if this is the first listener.
  // The channel-name pattern is per-business, subscribing multiple times is a
  // Redis no-op so we don't dedupe — cheap and correct.
  initRedisOnce().then((ok) => {
    if (ok && redisSub && !redisDisabled) {
      redisSub.subscribe(`${CHANNEL_PREFIX}${businessId}`).catch((err) => {
        console.warn('[Realtime] Redis subscribe failed:', err.message);
      });
    }
  }).catch(() => {});

  return () => localBus.off(key, handler);
}
