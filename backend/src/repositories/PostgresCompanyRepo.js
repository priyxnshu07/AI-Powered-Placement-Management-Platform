const db = require('../db');

/**
 * SOLID-SRP: Only handles company operations
 */
const PostgresCompanyRepo = {
  async findByRecruiterId(recruiterId) {
    const { rows } = await db.query(
      'SELECT * FROM companies WHERE recruiter_id = $1',
      [recruiterId]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await db.query('SELECT * FROM companies');
    return rows;
  },

  async create({ name, industry, recruiter_id }) {
    const { rows } = await db.query(
      'INSERT INTO companies (name, industry, recruiter_id) VALUES ($1, $2, $3) RETURNING *',
      [name, industry, recruiter_id]
    );
    return rows[0];
  }
};

module.exports = PostgresCompanyRepo;
