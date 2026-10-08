const bcrypt = require('bcryptjs');
const config = require('../config');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const { badRequest, notFound } = require('../errors');

// SOLID-ISP: Only admin operations
class AdminController {
  async getAllUsers(req, res) {
    const users = await PostgresUserRepo.getAllUsers();
    res.json({ success: true, data: users });
  }

  async createUser(req, res) {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // A duplicate email surfaces as Postgres 23505 and is returned as 409 by the error handler.
    const user = await PostgresUserRepo.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ success: true, data: user });
  }

  async deactivateUser(req, res) {
    if (req.params.id === req.user.id) throw badRequest('You cannot deactivate your own account');
    const user = await PostgresUserRepo.deactivate(req.params.id);
    if (!user) throw notFound('User not found');
    // Takes effect immediately: authMiddleware re-checks is_active on every request.
    res.json({ success: true, message: 'User deactivated', data: user });
  }

  async getAIConfig(req, res) {
    res.json({ success: true, data: { confidenceThreshold: config.aiConfidenceThreshold } });
  }

  async updateAIConfig(req, res) {
    // In-memory for now (resets on restart); a settings table would persist it.
    config.aiConfidenceThreshold = req.body.threshold;
    res.json({
      success: true,
      message: 'AI config updated (in-memory, resets on restart)',
      data: { threshold: config.aiConfidenceThreshold },
    });
  }
}

module.exports = new AdminController();
