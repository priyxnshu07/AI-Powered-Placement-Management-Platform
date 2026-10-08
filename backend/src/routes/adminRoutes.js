const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

module.exports = function adminRoutes() {
  const router = express.Router();
  router.use(authMiddleware, roleGuard('admin'));

  router.get('/users', asyncHandler(AdminController.getAllUsers));
  router.post('/users', validate(schemas.createUser), asyncHandler(AdminController.createUser));
  router.delete('/users/:id', validate(schemas.idParam, 'params'), asyncHandler(AdminController.deactivateUser));
  router.get('/ai/config', asyncHandler(AdminController.getAIConfig));
  router.put('/ai/config', validate(schemas.aiConfig), asyncHandler(AdminController.updateAIConfig));

  return router;
};
