const bcrypt = require('bcryptjs');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const db = require('../db');

// SOLID-ISP: Only admin operations
class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const users = await PostgresUserRepo.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await PostgresUserRepo.create({ name, email, password: hashedPassword, role });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      // Logic for soft delete / deactivation
      await db.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
      res.json({ success: true, message: 'User deactivated' });
    } catch (err) {
      next(err);
    }
  }

  async getAIConfig(req, res) {
    res.json({
      success: true,
      data: {
        confidenceThreshold: process.env.AI_CONFIDENCE_THRESHOLD || 0.6
      }
    });
  }

  async updateAIConfig(req, res) {
    // In a real app, this would update a database setting
    const { threshold } = req.body;
    process.env.AI_CONFIDENCE_THRESHOLD = threshold;
    res.json({ success: true, message: 'AI config updated (session-only)', data: { threshold } });
  }
}

module.exports = new AdminController();
