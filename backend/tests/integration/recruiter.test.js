const request = require('supertest');
const { resetDatabase, buildApp, login, one, jobId, PASSWORDS, db } = require('../helpers');

let app;
let techcorp; // rec1 owns TechCorp's jobs
let infosys; // rec2 owns Infosys's jobs

beforeAll(async () => {
  await resetDatabase();
  app = buildApp();
  techcorp = await login(app, 'rec1@techcorp.com', PASSWORDS.recruiter);
  infosys = await login(app, 'rec2@infosys.com', PASSWORDS.recruiter);
});

afterAll(() => db.pool.end());

const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

// Seeded: student1 applied to TechCorp's "Full Stack Developer".
const techcorpApplication = () =>
  one(
    `SELECT a.* FROM applications a JOIN users u ON u.id = a.student_id
     JOIN job_listings j ON j.id = a.job_id
     WHERE u.email = 'student1@college.edu' AND j.title = 'Full Stack Developer'`
  );

describe('ownership checks (IDOR regression)', () => {
  test("a recruiter cannot list another company's applicants", async () => {
    const res = await as(infosys, request(app).get(`/api/recruiter/jobs/${await jobId('Full Stack Developer')}/applicants`));
    expect(res.status).toBe(404);
  });

  test('a recruiter can list their own applicants, best AI match first', async () => {
    const res = await as(techcorp, request(app).get(`/api/recruiter/jobs/${await jobId('Full Stack Developer')}/applicants`));
    expect(res.status).toBe(200);
    const scores = res.body.data.map((a) => a.ai_match_score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test("a recruiter cannot change the status of another company's application", async () => {
    const app1 = await techcorpApplication();
    const res = await as(infosys, request(app).patch(`/api/recruiter/applications/${app1.id}/status`)).send({ status: 'rejected' });
    expect(res.status).toBe(404);
    expect((await techcorpApplication()).status).toBe('applied'); // unchanged in the database
  });

  test("a recruiter cannot schedule interviews on another company's application", async () => {
    const app1 = await techcorpApplication();
    const res = await as(infosys, request(app).post('/api/recruiter/interviews')).send({
      application_id: app1.id,
      scheduled_at: '2030-01-15T10:00',
      mode: 'Online',
    });
    expect(res.status).toBe(404);
  });
});

describe('application workflow', () => {
  test('rejects an unknown status value', async () => {
    const app1 = await techcorpApplication();
    const res = await as(techcorp, request(app).patch(`/api/recruiter/applications/${app1.id}/status`)).send({ status: 'hired' });
    expect(res.status).toBe(400);
  });

  test('scheduling an interview moves the application to interview_scheduled', async () => {
    const app1 = await techcorpApplication();
    const res = await as(techcorp, request(app).post('/api/recruiter/interviews')).send({
      application_id: app1.id,
      scheduled_at: '2030-01-15T10:00',
      mode: 'Online',
      meeting_link: '',
    });
    expect(res.status).toBe(201);
    expect((await techcorpApplication()).status).toBe('interview_scheduled');
  });

  test('marking an offer also marks the student as placed, atomically', async () => {
    const app1 = await techcorpApplication();
    const res = await as(techcorp, request(app).patch(`/api/recruiter/applications/${app1.id}/status`)).send({ status: 'offered' });
    expect(res.status).toBe(200);
    const profile = await one('SELECT is_placed FROM student_profiles WHERE user_id = $1', [app1.student_id]);
    expect(profile.is_placed).toBe(true);
  });

  test('createJob ignores a client-supplied company_id', async () => {
    const infosysCompany = await one("SELECT id FROM companies WHERE name = 'Infosys'");
    const res = await as(techcorp, request(app).post('/api/recruiter/jobs')).send({
      title: 'Backend Intern',
      required_skills: ['Node.js'],
      min_cgpa: 7,
      salary_lpa: 6,
      deadline: '',
      company_id: infosysCompany.id,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.company_id).not.toBe(infosysCompany.id);
  });
});
