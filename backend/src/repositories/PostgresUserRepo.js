const db = require('../db');

const PUBLIC_USER_COLUMNS = 'id, name, email, role, is_active, created_at';

/**
 * @implements {import('../interfaces/IUserRepository')}
 * SOLID-DIP: Implements IUserRepository
 * SOLID-SRP: Only handles user database operations
 */
const PostgresUserRepo = {
  async findById(id) {
    const { rows } = await db.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0];
  },

  // Only used by login: the one place the password hash is needed.
  async findByEmailWithPassword(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async create({ name, email, password, role }) {
    // Never RETURNING * here: that sent the bcrypt hash back to the admin UI.
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [name, email, password, role]
    );
    return rows[0];
  },

  async deactivate(id) {
    const { rows } = await db.query(
      `UPDATE users SET is_active = false WHERE id = $1 RETURNING ${PUBLIC_USER_COLUMNS}`,
      [id]
    );
    return rows[0];
  },

  /**
   * Upsert of the student-editable fields only. `is_placed` is intentionally
   * absent: it is owned by the placement workflow (see markPlaced).
   * Relies on the UNIQUE index on student_profiles.user_id.
   */
  async upsertProfile(userId, { branch, cgpa, skills, resume_text, year_of_passing }) {
    const { rows } = await db.query(
      `INSERT INTO student_profiles (user_id, branch, cgpa, skills, resume_text, year_of_passing)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         branch = EXCLUDED.branch,
         cgpa = EXCLUDED.cgpa,
         skills = EXCLUDED.skills,
         resume_text = EXCLUDED.resume_text,
         year_of_passing = EXCLUDED.year_of_passing
       RETURNING *`,
      [userId, branch, cgpa, skills, resume_text ?? null, year_of_passing ?? null]
    );
    return rows[0];
  },

  async markPlaced(studentId, client = db) {
    await client.query('UPDATE student_profiles SET is_placed = true WHERE user_id = $1', [studentId]);
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
    const { rows } = await db.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY id`);
    return rows;
  },
};

module.exports = PostgresUserRepo;
