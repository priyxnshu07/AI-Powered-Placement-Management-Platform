const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

// Compared against when the email doesn't exist, so "unknown email" and
// "wrong password" take the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 10);

// SOLID-SRP: Only authentication operations
module.exports = function authRoutes({ limiters }) {
  const router = express.Router();

  router.post(
    '/login',
    limiters.login,
    validate(schemas.login),
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const user = await PostgresUserRepo.findByEmailWithPassword(email);

      const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
      if (!user || !passwordOk || !user.is_active) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      return res.json({
        success: true,
        data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      });
    })
  );

  router.get(
    '/me',
    authMiddleware,
    asyncHandler(async (req, res) => {
      const profile = req.user.role === 'student' ? await PostgresUserRepo.getStudentProfile(req.user.id) : null;
      res.json({ success: true, data: { user: req.user, profile: profile ?? null } });
    })
  );

  return router;
};
