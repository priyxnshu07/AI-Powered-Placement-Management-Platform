const express = require('express');
const OfficerController = require('../controllers/OfficerController');
const { authMiddleware, roleGuard } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(roleGuard('placement_officer'));

router.get('/dashboard', OfficerController.getDashboard);
router.get('/students', OfficerController.getAllStudents);
router.get('/jobs', OfficerController.getAllJobs);
router.get('/applications', OfficerController.getAllApplications);

module.exports = router;
