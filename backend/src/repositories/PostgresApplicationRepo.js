const db = require('../db');

/**
 * SOLID-SRP: Only handles application and interview operations
 */
const PostgresApplicationRepo = {
  /**
   * Inserts an application, or returns null if this student already applied
   * to this job. ON CONFLICT DO NOTHING makes the duplicate check atomic: the
   * UNIQUE (student_id, job_id) index decides, so concurrent requests cannot
   * race past an application-level "already applied?" check.
   */
  async create({ student_id, job_id, ai_match_score, ai_match_reason, ai_provider }) {
    const { rows } = await db.query(
      `INSERT INTO applications (student_id, job_id, ai_match_score, ai_match_reason, ai_provider)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, job_id) DO NOTHING
       RETURNING *`,
      [student_id, job_id, ai_match_score, ai_match_reason, ai_provider]
    );
    return rows[0] || null;
  },

  async exists(studentId, jobId) {
    const { rows } = await db.query(
      'SELECT 1 FROM applications WHERE student_id = $1 AND job_id = $2',
      [studentId, jobId]
    );
    return rows.length > 0;
  },

  // Application plus the recruiter who owns the job — used for authorization checks.
  async findByIdWithOwner(applicationId) {
    const { rows } = await db.query(
      `SELECT a.*, c.recruiter_id
       FROM applications a
       JOIN job_listings jl ON a.job_id = jl.id
       JOIN companies c ON jl.company_id = c.id
       WHERE a.id = $1`,
      [applicationId]
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
       ORDER BY a.ai_match_score DESC NULLS LAST`,
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

  async updateStatus(applicationId, status, client = db) {
    const { rows } = await client.query(
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
       WHERE a.student_id = $1
       ORDER BY islots.scheduled_at`,
      [studentId]
    );
    return rows;
  },

  async createInterview({ application_id, scheduled_at, mode, meeting_link }, client = db) {
    const { rows } = await client.query(
      `INSERT INTO interview_slots (application_id, scheduled_at, mode, meeting_link)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [application_id, scheduled_at, mode, meeting_link ?? null]
    );
    return rows[0];
  },
};

module.exports = PostgresApplicationRepo;
