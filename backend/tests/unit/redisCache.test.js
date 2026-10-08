const { createRedisCache, noopCache } = require('../../src/cache/redisCache');

describe('redisCache graceful degradation', () => {
  test('with Redis unreachable, reads are fast misses and writes are silent no-ops', async () => {
    const logger = { warn: jest.fn() };
    // Port 1: nothing listens there, so the connection is refused.
    const cache = createRedisCache('redis://127.0.0.1:1', { logger });
    try {
      const started = Date.now();
      await expect(cache.getJSON('k')).resolves.toBeNull();
      await expect(cache.setJSON('k', { a: 1 }, 60)).resolves.toBeUndefined();
      expect(Date.now() - started).toBeLessThan(100); // no waiting on a dead server
    } finally {
      await cache.close();
    }
  });

  test('a malformed REDIS_URL falls back to no cache without crashing or leaking the secret', () => {
    const logger = { warn: jest.fn() };
    const pasted = 'REDIS_URL="rediss://default:sup3r-secret@example.upstash.io:6379"';

    const cache = createRedisCache(pasted, { logger });

    expect(cache).toBe(noopCache);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const message = logger.warn.mock.calls[0][0];
    expect(message).toMatch(/not a valid URL/);
    expect(message).not.toContain('sup3r-secret');
  });

  test('noopCache always misses', async () => {
    await noopCache.setJSON('k', { a: 1 }, 60);
    await expect(noopCache.getJSON('k')).resolves.toBeNull();
  });
});

// Runs only where a real Redis is available (locally via docker-compose, and in CI).
const describeIfRedis = process.env.TEST_REDIS_URL ? describe : describe.skip;
describeIfRedis('redisCache against a live Redis', () => {
  test('round-trips JSON with a TTL', async () => {
    const cache = createRedisCache(process.env.TEST_REDIS_URL);
    try {
      await new Promise((resolve) => cache.client.once('ready', resolve));
      const key = `test:${Date.now()}`;
      await cache.setJSON(key, { score: 0.9 }, 30);
      await expect(cache.getJSON(key)).resolves.toEqual({ score: 0.9 });
      expect(await cache.client.ttl(key)).toBeGreaterThan(0);
    } finally {
      await cache.close();
    }
  });
});
