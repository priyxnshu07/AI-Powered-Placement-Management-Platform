const request = require('supertest');
const db = require('../src/db');
const { createTables } = require('../src/database/schema');
const { seedData } = require('../src/database/seed');
const { createApp } = require('../src/app');

/** Drops everything and rebuilds the schema + demo seed. Integration tests own this database. */
async function resetDatabase() {
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  const log = console.log;
  console.log = () => {}; // keep seed chatter out of test output
  try {
    await createTables();
    await seedData();
  } finally {
    console.log = log;
  }
}

// Generous limits by default so suites don't trip each other; rate-limit
// tests build their own app with tight limits.
const buildApp = (rateLimits = { loginMax: 1000, applyMax: 1000 }) => createApp({ rateLimits });

async function login(app, email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

const one = async (sql, params) => (await db.query(sql, params)).rows[0];

const jobId = async (title) => (await one('SELECT id FROM job_listings WHERE title = $1', [title])).id;
const userId = async (email) => (await one('SELECT id FROM users WHERE email = $1', [email])).id;

const PASSWORDS = {
  student: 'student123',
  recruiter: 'recruiter123',
  officer: 'officer123',
  admin: 'admin123',
};

module.exports = { resetDatabase, buildApp, login, one, jobId, userId, PASSWORDS, db };
