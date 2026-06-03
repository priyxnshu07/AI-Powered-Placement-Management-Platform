const express = require('express');
const StudentController = require('../controllers/StudentController');
const { authMiddleware, roleGuard } = require('../middleware/auth');

const router = express.Router();

// SOLID-ISP: All routes require role=student
router.use(authMiddleware);
router.use(roleGuard('student'));

router.get('/profile', StudentController.getProfile);
router.put('/profile', StudentController.updateProfile);
router.get('/jobs', StudentController.getEligibleJobs);
router.post('/jobs/:id/apply', StudentController.applyToJob);
router.get('/applications', StudentController.getApplications);
router.get('/interviews', StudentController.getInterviews);

module.exports = router;
