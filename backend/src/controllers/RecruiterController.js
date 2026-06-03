const PostgresJobRepo = require('../repositories/PostgresJobRepo');
const PostgresCompanyRepo = require('../repositories/PostgresCompanyRepo');
const PostgresApplicationRepo = require('../repositories/PostgresApplicationRepo');

// SOLID-ISP: Only recruiter-facing operations
class RecruiterController {
  async getJobs(req, res, next) {
    try {
      const company = await PostgresCompanyRepo.findByRecruiterId(req.user.id);
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
      
      const jobs = await PostgresJobRepo.getByCompany(company.id);
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  async createJob(req, res, next) {
    try {
      const company = await PostgresCompanyRepo.findByRecruiterId(req.user.id);
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

      const jobData = { ...req.body, company_id: company.id };
      const job = await PostgresJobRepo.create(jobData);
      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  async getApplicants(req, res, next) {
    try {
      const jobId = req.params.id;
      // Verification that job belongs to recruiter's company could be added here
      const applicants = await PostgresApplicationRepo.findByJob(jobId);
      res.json({ success: true, data: applicants });
    } catch (err) {
      next(err);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updatedApp = await PostgresApplicationRepo.updateStatus(req.params.id, status);
      res.json({ success: true, data: updatedApp });
    } catch (err) {
      next(err);
    }
  }

  async scheduleInterview(req, res, next) {
    try {
      const interview = await PostgresApplicationRepo.createInterview(req.body);
      res.status(201).json({ success: true, data: interview });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecruiterController();
