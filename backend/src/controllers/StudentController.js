const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const PostgresJobRepo = require('../repositories/PostgresJobRepo');
const PostgresApplicationRepo = require('../repositories/PostgresApplicationRepo');
const aiMatchingService = require('../services/AIMatchingService');
const { badRequest, notFound, conflict, forbidden } = require('../errors');

/**
 * SOLID-ISP: Exposes only student-relevant operations.
 * SOLID-DIP: Depends on repository and service abstractions.
 * Errors are thrown and handled centrally (see middleware/errorHandler.js).
 */
class StudentController {
  async getProfile(req, res) {
    const profile = await PostgresUserRepo.getStudentProfile(req.user.id);
    res.json({ success: true, data: profile ?? null });
  }

  async updateProfile(req, res) {
    // req.body was validated and stripped by the studentProfile schema, so
    // fields like is_placed can never arrive here.
    const profile = await PostgresUserRepo.upsertProfile(req.user.id, req.body);
    res.json({ success: true, data: profile });
  }

  async getEligibleJobs(req, res) {
    const profile = await PostgresUserRepo.getStudentProfile(req.user.id);
    if (!profile) throw badRequest('Student profile not found. Please complete profile first.');
    const jobs = await PostgresJobRepo.findEligibleForStudent(profile);
    res.json({ success: true, data: jobs });
  }

  async applyToJob(req, res) {
    const jobId = req.params.id;
    const studentId = req.user.id;

    const [profile, job] = await Promise.all([
      PostgresUserRepo.getStudentProfile(studentId),
      PostgresJobRepo.findById(jobId),
    ]);

    if (!profile) throw badRequest('Student profile not found. Please complete profile first.');
    if (!job) throw notFound('Job not found');
    if (!job.is_active) throw badRequest('This job is no longer accepting applications');
    if (job.deadline && new Date(job.deadline) < startOfToday()) {
      throw badRequest('The application deadline for this job has passed');
    }
    // The job list hides ineligible jobs, but the API must enforce it too:
    // anyone can call POST /apply directly.
    if (Number(profile.cgpa) < Number(job.min_cgpa)) {
      throw forbidden(`Minimum CGPA for this job is ${job.min_cgpa}`);
    }

    // Cheap pre-check so a repeat click doesn't spend an LLM call. It is an
    // optimisation only; the UNIQUE constraint below is the real guarantee.
    if (await PostgresApplicationRepo.exists(studentId, jobId)) {
      throw conflict('Already applied to this job');
    }

    const match = await aiMatchingService.getMatchScore(profile, job);

    const application = await PostgresApplicationRepo.create({
      student_id: studentId,
      job_id: jobId,
      ai_match_score: match.score,
      ai_match_reason: match.reason,
      ai_provider: match.provider,
    });

    // null => a concurrent request inserted first; the database rejected the duplicate.
    if (!application) throw conflict('Already applied to this job');

    res.status(201).json({ success: true, data: application });
  }

  async getApplications(req, res) {
    const apps = await PostgresApplicationRepo.findByStudent(req.user.id);
    res.json({ success: true, data: apps });
  }

  async getInterviews(req, res) {
    const interviews = await PostgresApplicationRepo.getInterviewsByStudent(req.user.id);
    res.json({ success: true, data: interviews });
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = new StudentController();
