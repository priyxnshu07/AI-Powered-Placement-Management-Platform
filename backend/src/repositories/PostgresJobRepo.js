const db = require('../db');

/**
 * @implements {import('../interfaces/IJobRepository')}
 * SOLID-DIP: Implements IJobRepository
 * SOLID-SRP: Only handles job and database operations for jobs
 */
const PostgresJobRepo = {
  async findById(id) {
    const { rows } = await db.query(
      `SELECT jl.*, c.name as company_name, c.industry
       FROM job_listings jl
       JOIN companies c ON jl.company_id = c.id
       WHERE jl.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await db.query(
      `SELECT jl.*, c.name as company_name
       FROM job_listings jl
       JOIN companies c ON jl.company_id = c.id
       WHERE jl.is_active = true
       ORDER BY jl.created_at DESC`
    );
    return rows;
  },

  async findEligibleForStudent(studentProfile) {
    const cgpa = studentProfile.cgpa || 0;
    const { rows } = await db.query(
      `SELECT jl.*, c.name as company_name
       FROM job_listings jl
       JOIN companies c ON jl.company_id = c.id
       WHERE jl.is_active = true AND jl.min_cgpa <= $1
       ORDER BY jl.salary_lpa DESC`,
      [cgpa]
    );
    return rows;
  },

  async create({ company_id, title, description, required_skills, min_cgpa, salary_lpa, deadline }) {
    const { rows } = await db.query(
      `INSERT INTO job_listings (company_id, title, description, required_skills, min_cgpa, salary_lpa, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [company_id, title, description, required_skills, min_cgpa, salary_lpa, deadline]
    );
    return rows[0];
  },

  async getByCompany(companyId) {
    const { rows } = await db.query(
      'SELECT * FROM job_listings WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    return rows;
  }
};

module.exports = PostgresJobRepo;
