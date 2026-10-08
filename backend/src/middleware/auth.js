const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

const unauthorized = (res) => res.status(401).json({ success: false, error: 'Unauthorized' });

/**
 * SOLID-SRP: verifies the JWT and attaches req.user.
 *
 * A JWT alone stays valid until it expires (24h), so an admin "deactivate"
 * would not lock anyone out. One primary-key lookup per request re-checks
 * that the account still exists and is active, and takes the role from the
 * database rather than trusting the (possibly stale) token claim.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return unauthorized(res);

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice('Bearer '.length), config.jwtSecret);
  } catch {
    return unauthorized(res);
  }

  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = rows[0];
    if (!user || !user.is_active) return unauthorized(res);

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
};

const roleGuard = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  return next();
};

module.exports = { authMiddleware, roleGuard };
