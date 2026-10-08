const express = require('express');
const RecruiterController = require('../controllers/RecruiterController');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

module.exports = function recruiterRoutes() {
  const router = express.Router();
  router.use(authMiddleware, roleGuard('recruiter'));

  router.get('/jobs', asyncHandler(RecruiterController.getJobs));
  router.post('/jobs', validate(schemas.createJob), asyncHandler(RecruiterController.createJob));
  router.get(
    '/jobs/:id/applicants',
    validate(schemas.idParam, 'params'),
    asyncHandler(RecruiterController.getApplicants)
  );
  router.patch(
    '/applications/:id/status',
    validate(schemas.idParam, 'params'),
    validate(schemas.applicationStatus),
    asyncHandler(RecruiterController.updateApplicationStatus)
  );
  router.post('/interviews', validate(schemas.scheduleInterview), asyncHandler(RecruiterController.scheduleInterview));

  return router;
};
