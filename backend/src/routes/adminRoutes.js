const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authMiddleware, roleGuard } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard('admin'));

router.get('/users', AdminController.getAllUsers);
router.post('/users', AdminController.createUser);
router.delete('/users/:id', AdminController.deactivateUser);
router.get('/ai/config', AdminController.getAIConfig);
router.put('/ai/config', AdminController.updateAIConfig);

module.exports = router;
