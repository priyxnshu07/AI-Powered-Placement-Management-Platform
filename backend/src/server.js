const config = require('./config');
const db = require('./db');
const { createApp } = require('./app');
const { createTables } = require('./database/schema');
const { seedData } = require('./database/seed');
const { createRedisCache, noopCache } = require('./cache/redisCache');
const aiMatchingService = require('./services/AIMatchingService');
const geminiProvider = require('./ai/geminiProvider');

async function startServer() {
  await createTables();
  if (config.seedDemoData) await seedData();

  const cache = config.redisUrl ? createRedisCache(config.redisUrl) : noopCache;
  aiMatchingService.setCache(cache);

  const app = createApp({ cache });
  const server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port} (${config.env})`);
    console.log(`AI matching: ${geminiProvider.isConfigured ? `Gemini (${geminiProvider.model})` : 'rule-based only (GEMINI_API_KEY not set)'}`);
    console.log(`Match cache: ${cache.name}`);
  });

  // Graceful shutdown: stop taking new connections, let in-flight requests
  // finish, then close Redis and the Postgres pool. Hosting platforms send
  // SIGTERM on every deploy.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await cache.close();
      await db.pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
