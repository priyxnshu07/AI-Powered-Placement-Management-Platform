const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const db = require('./db');
const errorHandler = require('./middleware/errorHandler');
const { createLimiters } = require('./middleware/rateLimit');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');

/**
 * Builds the Express app without starting a server or touching the schema.
 * Tests import this directly and drive it with supertest.
 */
function createApp({ rateLimits, cache } = {}) {
  const app = express();
  const limiters = createLimiters(rateLimits);

  // Behind Render/Railway/Heroku-style proxies, trust the first hop so
  // req.ip (used by the login rate limiter) is the real client IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      // An explicit allow-list. The previous `origin: true` reflected ANY
      // origin, which with credentials lets any website call the API as the user.
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );
  if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/auth', authRoutes({ limiters }));
  app.use('/api/student', studentRoutes({ limiters }));
  app.use('/api/recruiter', recruiterRoutes());
  app.use('/api/officer', officerRoutes());
  app.use('/api/admin', adminRoutes());

  // Liveness + dependency status, for the hosting platform's health check.
  // Also served under /api so the frontend can reach it via its API base URL.
  app.get(['/health', '/api/health'], async (req, res) => {
    let database = 'ok';
    try {
      await db.query('SELECT 1');
    } catch {
      database = 'down';
    }
    const status = database === 'ok' ? 'ok' : 'degraded';
    res.status(database === 'ok' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'placement-platform-backend',
      dependencies: {
        database,
        cache: cache ? (cache.client?.isReady ? 'ok' : cache.name === 'none' ? 'disabled' : 'down') : 'disabled',
      },
    });
  });

  app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
