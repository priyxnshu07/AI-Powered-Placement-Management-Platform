/**
 * A tiny cache abstraction with two implementations:
 *   - createRedisCache(url): backed by Redis
 *   - noopCache: used when REDIS_URL is not set
 *
 * Redis is an optimisation, never a dependency: if Redis is down, slow or
 * misconfigured, every call resolves as a cache miss and the request carries
 * on. A cache outage must never take the apply flow down with it.
 */

const noopCache = {
  name: 'none',
  async getJSON() {
    return null;
  },
  async setJSON() {},
  async close() {},
};

function createRedisCache(url, { logger = console } = {}) {
  const { createClient } = require('redis');

  let client;
  try {
    client = createClient({
      url,
      // Fail commands immediately while disconnected instead of queueing them
      // behind a reconnect; a queued GET would stall the request it serves.
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
      },
    });
  } catch (err) {
    // A malformed REDIS_URL (e.g. pasted with quotes or a "REDIS_URL=" prefix)
    // throws synchronously. Degrade to no cache instead of crashing the app.
    // Never log `err` itself: Node's URL error echoes the input, password included.
    logger.warn(
      `[redis] REDIS_URL is not a valid URL (${err.code || err.name}); running without a cache. ` +
        'Expected a value like rediss://default:<password>@<host>:6379 with no quotes or "REDIS_URL=" prefix.'
    );
    return noopCache;
  }

  let lastErrorLog = 0;
  client.on('error', (err) => {
    // Without a listener node-redis would crash the process. Throttle logs
    // so a Redis outage does not flood them.
    if (Date.now() - lastErrorLog > 30_000) {
      lastErrorLog = Date.now();
      logger.warn(`[redis] ${err.message} (running uncached until it reconnects)`);
    }
  });

  // Connect in the background; boot does not wait on Redis.
  client.connect().catch(() => {});

  return {
    name: 'redis',
    client,

    async getJSON(key) {
      if (!client.isReady) return null;
      try {
        const raw = await client.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    async setJSON(key, value, ttlSeconds) {
      if (!client.isReady) return;
      try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      } catch {
        /* cache writes are best-effort */
      }
    },

    async close() {
      try {
        // close() drains pending commands; destroy() also stops a reconnect
        // loop that would otherwise keep the process alive.
        if (client.isReady) await client.close();
        else if (client.isOpen) client.destroy();
      } catch {
        /* ignore */
      }
    },
  };
}

module.exports = { createRedisCache, noopCache };
