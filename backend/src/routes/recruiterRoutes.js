const express = require('express');
const RecruiterController = require('../controllers/RecruiterController');
const { authMiddleware, roleGuard } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard('recruiter'));

router.get('/jobs', RecruiterController.getJobs);
router.post('/jobs', RecruiterController.createJob);
router.get('/jobs/:id/applicants', RecruiterController.getApplicants);
router.patch('/applications/:id/status', RecruiterController.updateApplicationStatus);
router.post('/interviews', RecruiterController.scheduleInterview);

module.exports = router;
