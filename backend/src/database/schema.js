const db = require('../db');

async function createTables() {
  const queryText = `
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
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
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
      applied_at TIMESTAMPTZ DEFAULT NOW()
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

  try {
    await db.query(queryText);
    console.log('Database tables created successfully.');
  } catch (err) {
    console.error('Error creating database tables:', err);
    throw err;
  }
}

module.exports = { createTables };
