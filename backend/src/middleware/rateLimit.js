const { rateLimit } = require('express-rate-limit');

/**
 * Two limits with two different purposes:
 *
 * - login: blunts password guessing. Keyed by client IP because the caller
 *   is not authenticated yet.
 * - apply: every application may trigger a paid LLM call, so it is keyed by
 *   the authenticated user id — the thing we want to cap — not the IP, which
 *   a whole college campus behind one NAT would share.
 *
 * Uses the in-memory store: correct for a single instance. Running several
 * instances would need a shared store (e.g. rate-limit-redis) so the limit
 * is global rather than per instance.
 */
const json429 = (message) => (req, res) => res.status(429).json({ success: false, error: message });

function createLimiters({ loginMax = 10, loginWindowMs = 15 * 60 * 1000, applyMax = 20, applyWindowMs = 60 * 1000 } = {}) {
  return {
    login: rateLimit({
      windowMs: loginWindowMs,
      limit: loginMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      // Only failed logins count, so a user who mistypes once isn't punished for later successes.
      skipSuccessfulRequests: true,
      handler: json429('Too many login attempts. Please try again later.'),
    }),
    apply: rateLimit({
      windowMs: applyWindowMs,
      limit: applyMax,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      keyGenerator: (req) => `user:${req.user.id}`,
      handler: json429('Too many applications in a short time. Please slow down.'),
    }),
  };
}

module.exports = { createLimiters };
