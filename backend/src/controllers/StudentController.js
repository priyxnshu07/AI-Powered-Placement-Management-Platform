const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const PostgresJobRepo = require('../repositories/PostgresJobRepo');
const PostgresApplicationRepo = require('../repositories/PostgresApplicationRepo');
const aiMatchingService = require('../services/AIMatchingService');

// SOLID-ISP: Only student-facing operations
// SOLID-DIP: Depends on Repository and Service abstractions (factory-initialized)

/**
 * SOLID-ISP: Interface Segregation - Exposes only student-relevant operations.
 * SOLID-DIP: Dependency Inversion - Depends on Repository and Service abstractions (factory-initialized).
 */
class StudentController {
  async getProfile(req, res, next) {
    try {
      const profile = await PostgresUserRepo.getStudentProfile(req.user.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profileData = req.body; // branch, cgpa, skills, resume_text, year_of_passing
      const profile = await PostgresUserRepo.updateProfile(req.user.id, profileData);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getEligibleJobs(req, res, next) {
    try {
      const profile = await PostgresUserRepo.getStudentProfile(req.user.id);
      if (!profile) {
        return res.status(400).json({ success: false, error: 'Student profile not found. Please complete profile first.' });
      }
      const jobs = await PostgresJobRepo.findEligibleForStudent(profile);
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  async applyToJob(req, res, next) {
    try {
      const jobId = req.params.id;
      const studentId = req.user.id;

      const profile = await PostgresUserRepo.getStudentProfile(studentId);
      const job = await PostgresJobRepo.findById(jobId);

      if (!profile || !job) {
        return res.status(404).json({ success: false, error: 'Profile or Job not found' });
      }

      // Check if already applied
      const existingApps = await PostgresApplicationRepo.findByStudent(studentId);
      if (existingApps.some(app => app.job_id == jobId)) {
        return res.status(400).json({ success: false, error: 'Already applied to this job' });
      }

      const matchResult = await aiMatchingService.getMatchScore(profile, job);

      const application = await PostgresApplicationRepo.create({
        student_id: studentId,
        job_id: jobId,
        ai_match_score: matchResult.score,
        ai_match_reason: matchResult.reason
      });

      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  async getApplications(req, res, next) {
    try {
      const apps = await PostgresApplicationRepo.findByStudent(req.user.id);
      res.json({ success: true, data: apps });
    } catch (err) {
      next(err);
    }
  }

  async getInterviews(req, res, next) {
    try {
      const interviews = await PostgresApplicationRepo.getInterviewsByStudent(req.user.id);
      res.json({ success: true, data: interviews });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudentController();
