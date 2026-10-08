const request = require('supertest');
const { resetDatabase, buildApp, login, one, jobId, userId, PASSWORDS, db } = require('../helpers');

let app;
let token;

beforeAll(async () => {
  await resetDatabase();
  app = buildApp();
  // student4 has no applications in the seed and a 9.1 CGPA after setup below.
  token = await login(app, 'student4@college.edu', PASSWORDS.student);
});

afterAll(() => db.pool.end());

const auth = (req) => req.set('Authorization', `Bearer ${token}`);
const profileBody = { branch: 'CSE', cgpa: 9.1, skills: ['Python', 'TensorFlow', 'SQL'] };

describe('PUT /api/student/profile', () => {
  test('saves the profile (regression: ON CONFLICT without a unique index returned 500)', async () => {
    const res = await auth(request(app).put('/api/student/profile')).send(profileBody);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ branch: 'CSE', cgpa: 9.1 });
  });

  test('updating twice keeps exactly one profile row', async () => {
    await auth(request(app).put('/api/student/profile')).send({ ...profileBody, branch: 'ECE' });
    const res = await auth(request(app).put('/api/student/profile')).send(profileBody);
    expect(res.status).toBe(200);
    const id = await userId('student4@college.edu');
    expect(Number((await one('SELECT COUNT(*) FROM student_profiles WHERE user_id = $1', [id])).count)).toBe(1);
  });

  test('a student cannot mark themselves as placed (mass assignment)', async () => {
    const res = await auth(request(app).put('/api/student/profile')).send({ ...profileBody, is_placed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.is_placed).toBe(false);
  });

  test.each([
    ['CGPA above 10', { cgpa: 11 }],
    ['skills not an array', { skills: 'Python' }],
    ['missing branch', { branch: undefined }],
  ])('rejects invalid input: %s', async (_label, patch) => {
    const res = await auth(request(app).put('/api/student/profile')).send({ ...profileBody, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('POST /api/student/jobs/:id/apply', () => {
  test('creates an application scored by the fallback engine when Gemini is not configured', async () => {
    const res = await auth(request(app).post(`/api/student/jobs/${await jobId('ML Engineer')}/apply`));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'applied', ai_provider: 'rule-based' });
    expect(res.body.data.ai_match_score).toBeGreaterThan(0);
  });

  test('applying again returns 409', async () => {
    const res = await auth(request(app).post(`/api/student/jobs/${await jobId('ML Engineer')}/apply`));
    expect(res.status).toBe(409);
  });

  test('10 concurrent applies create exactly one application (race condition regression)', async () => {
    const id = await jobId('Full Stack Developer');
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => auth(request(app).post(`/api/student/jobs/${id}/apply`)))
    );
    const statuses = responses.map((r) => r.status).sort();

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);
    const studentId = await userId('student4@college.edu');
    const { count } = await one('SELECT COUNT(*) FROM applications WHERE student_id = $1 AND job_id = $2', [studentId, id]);
    expect(Number(count)).toBe(1);
  });

  test('cannot apply below the minimum CGPA, even by calling the API directly', async () => {
    await auth(request(app).put('/api/student/profile')).send({ ...profileBody, cgpa: 6.5 });
    const res = await auth(request(app).post(`/api/student/jobs/${await jobId('System Associate')}/apply`));
    expect(res.status).toBe(403);
    await auth(request(app).put('/api/student/profile')).send(profileBody);
  });

  test('cannot apply after the deadline', async () => {
    const id = await jobId('System Associate');
    await db.query("UPDATE job_listings SET deadline = CURRENT_DATE - 1 WHERE id = $1", [id]);
    const res = await auth(request(app).post(`/api/student/jobs/${id}/apply`));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/deadline/i);

    const list = await auth(request(app).get('/api/student/jobs'));
    expect(list.body.data.map((j) => j.id)).not.toContain(id); // expired jobs are hidden too
    await db.query("UPDATE job_listings SET deadline = CURRENT_DATE + 30 WHERE id = $1", [id]);
  });

  test('unknown job returns 404 and a non-numeric id returns 400', async () => {
    expect((await auth(request(app).post('/api/student/jobs/999999/apply'))).status).toBe(404);
    expect((await auth(request(app).post('/api/student/jobs/abc/apply'))).status).toBe(400);
  });

  test('is rate limited per user', async () => {
    const limited = buildApp({ loginMax: 1000, applyMax: 2 });
    const t = await login(limited, 'student2@college.edu', PASSWORDS.student);
    const hit = () => request(limited).post('/api/student/jobs/999999/apply').set('Authorization', `Bearer ${t}`);
    expect((await hit()).status).toBe(404);
    expect((await hit()).status).toBe(404);
    const third = await hit();
    expect(third.status).toBe(429);
    expect(third.body.success).toBe(false);
  });
});

describe('role guard', () => {
  test('a recruiter token cannot use student endpoints', async () => {
    const recruiter = await login(app, 'rec1@techcorp.com', PASSWORDS.recruiter);
    const res = await request(app).get('/api/student/profile').set('Authorization', `Bearer ${recruiter}`);
    expect(res.status).toBe(403);
  });
});
