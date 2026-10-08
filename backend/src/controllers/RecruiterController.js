const db = require('../db');
const PostgresJobRepo = require('../repositories/PostgresJobRepo');
const PostgresCompanyRepo = require('../repositories/PostgresCompanyRepo');
const PostgresApplicationRepo = require('../repositories/PostgresApplicationRepo');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const { badRequest, notFound } = require('../errors');

/**
 * SOLID-ISP: Only recruiter-facing operations.
 *
 * Authorization rule: a recruiter may only see or change data for jobs owned
 * by their own company. Requests for another company's job/application get
 * 404 rather than 403, so the API does not confirm that the record exists.
 */
class RecruiterController {
  async getJobs(req, res) {
    const company = await PostgresCompanyRepo.findByRecruiterId(req.user.id);
    if (!company) throw notFound('Company not found');
    const jobs = await PostgresJobRepo.getByCompany(company.id);
    res.json({ success: true, data: jobs });
  }

  async createJob(req, res) {
    const company = await PostgresCompanyRepo.findByRecruiterId(req.user.id);
    if (!company) throw notFound('Company not found');
    // req.body is whitelisted by the createJob schema; company_id comes from the token, never the client.
    const job = await PostgresJobRepo.create({ ...req.body, company_id: company.id });
    res.status(201).json({ success: true, data: job });
  }

  async getApplicants(req, res) {
    const job = await PostgresJobRepo.findById(req.params.id);
    if (!job || job.recruiter_id !== req.user.id) throw notFound('Job not found');
    const applicants = await PostgresApplicationRepo.findByJob(job.id);
    res.json({ success: true, data: applicants });
  }

  async updateApplicationStatus(req, res) {
    const application = await getOwnedApplication(req.params.id, req.user.id);
    const { status } = req.body;

    // Status change and placement flag are one unit of work: an "offered"
    // application must never exist without its student marked as placed.
    const updated = await db.transaction(async (client) => {
      const row = await PostgresApplicationRepo.updateStatus(application.id, status, client);
      if (status === 'offered') {
        await PostgresUserRepo.markPlaced(application.student_id, client);
      }
      return row;
    });

    res.json({ success: true, data: updated });
  }

  async scheduleInterview(req, res) {
    const application = await getOwnedApplication(req.body.application_id, req.user.id);
    if (application.status === 'rejected') {
      throw badRequest('Cannot schedule an interview for a rejected application');
    }

    const interview = await db.transaction(async (client) => {
      const slot = await PostgresApplicationRepo.createInterview(req.body, client);
      // Move the pipeline forward, but never backwards (e.g. from "offered").
      if (['applied', 'shortlisted'].includes(application.status)) {
        await PostgresApplicationRepo.updateStatus(application.id, 'interview_scheduled', client);
      }
      return slot;
    });

    res.status(201).json({ success: true, data: interview });
  }
}

async function getOwnedApplication(applicationId, recruiterId) {
  const application = await PostgresApplicationRepo.findByIdWithOwner(applicationId);
  if (!application || application.recruiter_id !== recruiterId) {
    throw notFound('Application not found');
  }
  return application;
}

module.exports = new RecruiterController();
