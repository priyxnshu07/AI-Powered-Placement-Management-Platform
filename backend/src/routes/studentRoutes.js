const express = require('express');
const StudentController = require('../controllers/StudentController');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

// SOLID-ISP: All routes require role=student
module.exports = function studentRoutes({ limiters }) {
  const router = express.Router();
  router.use(authMiddleware, roleGuard('student'));

  router.get('/profile', asyncHandler(StudentController.getProfile));
  router.put('/profile', validate(schemas.studentProfile), asyncHandler(StudentController.updateProfile));
  router.get('/jobs', asyncHandler(StudentController.getEligibleJobs));
  router.post(
    '/jobs/:id/apply',
    limiters.apply,
    validate(schemas.idParam, 'params'),
    asyncHandler(StudentController.applyToJob)
  );
  router.get('/applications', asyncHandler(StudentController.getApplications));
  router.get('/interviews', asyncHandler(StudentController.getInterviews));

  return router;
};
