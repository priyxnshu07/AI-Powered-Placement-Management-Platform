const config = require('../config');

// Postgres error codes we translate into client errors instead of 500s.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERRORS = {
  23505: { status: 409, message: 'Resource already exists' }, // unique_violation
  23503: { status: 400, message: 'Referenced resource does not exist' }, // foreign_key_violation
  23514: { status: 400, message: 'Value violates a constraint' }, // check_violation
  '22P02': { status: 400, message: 'Invalid input syntax' }, // invalid_text_representation
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Malformed JSON body' });
  }

  if (err.expose && err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  const pg = PG_ERRORS[err.code];
  if (pg) {
    return res.status(pg.status).json({ success: false, error: pg.message });
  }

  // Unexpected: log everything server-side, reveal nothing client-side.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    ...(config.isProduction ? {} : { debug: err.message }),
  });
};

module.exports = errorHandler;
