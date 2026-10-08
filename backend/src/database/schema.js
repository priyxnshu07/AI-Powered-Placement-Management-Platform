const db = require('../db');

/**
 * Idempotent schema setup. Safe to run on every boot.
 *
 * `CREATE TABLE IF NOT EXISTS` never alters an existing table, so constraints
 * and indexes added after the first release live in a separate block of
 * `CREATE ... IF NOT EXISTS` statements. That way databases created by older
 * versions of this code are upgraded too, not only fresh ones.
 */
const TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'recruiter', 'placement_officer', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    branch TEXT,
    cgpa FLOAT,
    skills TEXT[],
    resume_text TEXT,
    year_of_passing INT,
    is_placed BOOLEAN DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    recruiter_id INT REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS job_listings (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    required_skills TEXT[],
    min_cgpa FLOAT,
    salary_lpa FLOAT,
    deadline DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    job_id INT REFERENCES job_listings(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview_scheduled', 'offered', 'rejected')),
    ai_match_score FLOAT,
    ai_match_reason TEXT,
    ai_provider TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, job_id)
  );

  CREATE TABLE IF NOT EXISTS interview_slots (
    id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    mode TEXT,
    meeting_link TEXT,
    status TEXT DEFAULT 'pending'
  );
`;

const MIGRATIONS = `
  -- One profile per student. Required by the ON CONFLICT (user_id) upsert;
  -- without it every profile save failed with a 500.
  CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_user_id_key ON student_profiles (user_id);

  -- One application per (student, job). The database, not the app, is the
  -- source of truth: two concurrent "Apply" clicks can no longer both succeed.
  -- Databases created before this fix may already hold duplicates (the race
  -- produced them), which would make the unique index fail to build. Keep the
  -- earliest application of each pair and drop the rest first.
  DELETE FROM applications a
    USING applications b
    WHERE a.student_id = b.student_id AND a.job_id = b.job_id AND a.id > b.id;
  -- Same name Postgres auto-generates for the inline UNIQUE above, so fresh
  -- databases skip this instead of building a second identical index.
  CREATE UNIQUE INDEX IF NOT EXISTS applications_student_id_job_id_key ON applications (student_id, job_id);

  ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_provider TEXT;

  -- Indexes for the hot read paths (foreign keys are not indexed automatically in Postgres).
  CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications (job_id);
  CREATE INDEX IF NOT EXISTS job_listings_company_id_idx ON job_listings (company_id);
  CREATE INDEX IF NOT EXISTS job_listings_active_cgpa_idx ON job_listings (min_cgpa) WHERE is_active;
  CREATE INDEX IF NOT EXISTS companies_recruiter_id_idx ON companies (recruiter_id);
  CREATE INDEX IF NOT EXISTS interview_slots_application_id_idx ON interview_slots (application_id);
`;

async function createTables() {
  await db.query(TABLES);
  await db.query(MIGRATIONS);
}

module.exports = { createTables };
