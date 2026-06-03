const db = require('../db');

/**
 * SOLID-SRP: Only handles application and interview operations
 */
const PostgresApplicationRepo = {
  async create({ student_id, job_id, ai_match_score, ai_match_reason }) {
    const { rows } = await db.query(
      `INSERT INTO applications (student_id, job_id, ai_match_score, ai_match_reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [student_id, job_id, ai_match_score, ai_match_reason]
    );
    return rows[0];
  },

  async findByStudent(studentId) {
    const { rows } = await db.query(
      `SELECT a.*, jl.title, c.name as company_name
       FROM applications a
       JOIN job_listings jl ON a.job_id = jl.id
       JOIN companies c ON jl.company_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentId]
    );
    return rows;
  },

  async findByJob(jobId) {
    const { rows } = await db.query(
      `SELECT a.*, u.name as student_name, sp.branch, sp.cgpa, sp.skills
       FROM applications a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE a.job_id = $1
       ORDER BY a.ai_match_score DESC`,
      [jobId]
    );
    return rows;
  },

  async findAll() {
    const { rows } = await db.query(
      `SELECT a.*, u.name as student_name, jl.title, c.name as company_name
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN job_listings jl ON a.job_id = jl.id
       JOIN companies c ON jl.company_id = c.id
       ORDER BY a.applied_at DESC`
    );
    return rows;
  },

  async updateStatus(applicationId, status) {
    const { rows } = await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, applicationId]
    );
    return rows[0];
  },

  async getInterviewsByStudent(studentId) {
    const { rows } = await db.query(
      `SELECT islots.*, jl.title, c.name as company_name
       FROM interview_slots islots
       JOIN applications a ON islots.application_id = a.id
       JOIN job_listings jl ON a.job_id = jl.id
       JOIN companies c ON jl.company_id = c.id
       WHERE a.student_id = $1`,
      [studentId]
    );
    return rows;
  },

  async createInterview({ application_id, scheduled_at, mode, meeting_link }) {
    const { rows } = await db.query(
      `INSERT INTO interview_slots (application_id, scheduled_at, mode, meeting_link)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [application_id, scheduled_at, mode, meeting_link]
    );
    return rows[0];
  }
};

module.exports = PostgresApplicationRepo;
