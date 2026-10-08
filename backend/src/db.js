const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: config.databaseSslVerify } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

/**
 * Runs `fn` inside a single transaction on one pooled client.
 * Used where two writes must succeed or fail together
 * (e.g. marking an application "offered" AND the student "placed").
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  transaction,
  pool,
};
