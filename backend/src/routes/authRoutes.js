const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// SOLID-SRP: Only authentication operations
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await PostgresUserRepo.findByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    let profile = null;
    if (req.user.role === 'student') {
      profile = await PostgresUserRepo.getStudentProfile(req.user.id);
    }
    res.json({ success: true, data: { user: req.user, profile } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
