const db = require('../db');

/**
 * @implements {import('../interfaces/IUserRepository')}
 * SOLID-DIP: Implements IUserRepository
 * SOLID-SRP: Only handles user database operations
 */
const PostgresUserRepo = {
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async create({ name, email, password, role }) {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, password, role]
    );
    return rows[0];
  },

  async updateProfile(userId, { branch, cgpa, skills, resume_text, year_of_passing, is_placed }) {
    // Upsert logic for student_profile
    const { rows } = await db.query(
      `INSERT INTO student_profiles (user_id, branch, cgpa, skills, resume_text, year_of_passing, is_placed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         branch = EXCLUDED.branch,
         cgpa = EXCLUDED.cgpa,
         skills = EXCLUDED.skills,
         resume_text = EXCLUDED.resume_text,
         year_of_passing = EXCLUDED.year_of_passing,
         is_placed = EXCLUDED.is_placed
       RETURNING *`,
      [userId, branch, cgpa, skills, resume_text, year_of_passing, is_placed]
    );
    return rows[0];
  },

  async getStudentProfile(userId) {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, sp.*
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return rows[0];
  },

  async getAllStudents() {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, sp.branch, sp.cgpa, sp.skills, sp.is_placed
       FROM users u
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.role = 'student'`
    );
    return rows;
  },

  async getAllUsers() {
    const { rows } = await db.query('SELECT id, name, email, role, created_at FROM users');
    return rows;
  }
};

module.exports = PostgresUserRepo;
