/**
 * Centralised, validated configuration.
 * The app fails fast at boot if a required secret is missing, instead of
 * failing on the first login request with a cryptic jsonwebtoken error.
 */
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function number(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`Environment variable ${name} must be a number`);
  return parsed;
}

const config = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: number('PORT', 3000),

  databaseUrl: required('DATABASE_URL'),
  // Managed Postgres (Neon, Supabase, Render) requires TLS; local Docker does not.
  databaseSsl: process.env.DATABASE_SSL === 'true',
  // Verify the server certificate by default (Neon, Supabase, Render use public CAs).
  // Set DATABASE_SSL_VERIFY=false only for providers with self-signed certificates.
  databaseSslVerify: process.env.DATABASE_SSL_VERIFY !== 'false',

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Comma-separated list of allowed browser origins, e.g. "https://app.vercel.app,http://localhost:5173"
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // Optional: without REDIS_URL the app runs uncached rather than failing.
  redisUrl: process.env.REDIS_URL || '',
  matchCacheTtlSeconds: number('MATCH_CACHE_TTL_SECONDS', 60 * 60 * 24),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: number('GEMINI_TIMEOUT_MS', 8000),
  },

  aiConfidenceThreshold: number('AI_CONFIDENCE_THRESHOLD', 0.6),

  // Skip automatic demo seeding with SEED_DEMO_DATA=false
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
};

module.exports = config;
