const db = require('../db');
const PostgresUserRepo = require('../repositories/PostgresUserRepo');
const PostgresJobRepo = require('../repositories/PostgresJobRepo');
const PostgresApplicationRepo = require('../repositories/PostgresApplicationRepo');

// SOLID-ISP: Only placement officer operations
class OfficerController {
  async getDashboard(req, res, next) {
    try {
      const totalStudentsRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
      const placedRes = await db.query("SELECT COUNT(*) FROM student_profiles WHERE is_placed = true");
      const avgPackageRes = await db.query("SELECT AVG(jl.salary_lpa) FROM applications a JOIN job_listings jl ON a.job_id = jl.id WHERE a.status = 'offered'");
      
      const branchStats = await db.query(`
        SELECT branch, COUNT(*) as total, COUNT(*) FILTER (WHERE is_placed = true) as placed
        FROM student_profiles
        GROUP BY branch
      `);

      const topRecruiters = await db.query(`
        SELECT c.name, COUNT(a.id) as offers
        FROM applications a
        JOIN job_listings jl ON a.job_id = jl.id
        JOIN companies c ON jl.company_id = c.id
        WHERE a.status = 'offered'
        GROUP BY c.name
        ORDER BY offers DESC
        LIMIT 5
      `);

      const total = parseInt(totalStudentsRes.rows[0].count);
      const placed = parseInt(placedRes.rows[0].count);

      res.json({
        success: true,
        data: {
          totalStudents: total,
          placed,
          placementRate: total > 0 ? (placed / total * 100).toFixed(2) : 0,
          avgPackage: parseFloat(avgPackageRes.rows[0].avg || 0).toFixed(2),
          branchWiseStats: branchStats.rows,
          topRecruiters: topRecruiters.rows
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllStudents(req, res, next) {
    try {
      const students = await PostgresUserRepo.getAllStudents();
      res.json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  }

  async getAllJobs(req, res, next) {
    try {
      const jobs = await PostgresJobRepo.findAll();
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  async getAllApplications(req, res, next) {
    try {
      const apps = await PostgresApplicationRepo.findAll();
      res.json({ success: true, data: apps });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OfficerController();
