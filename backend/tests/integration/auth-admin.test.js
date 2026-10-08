const request = require('supertest');
const { resetDatabase, buildApp, login, userId, PASSWORDS, db } = require('../helpers');

let app;

beforeAll(async () => {
  await resetDatabase();
  app = buildApp();
});

afterAll(() => db.pool.end());

describe('auth', () => {
  test('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ADMIN@placement.dev', password: PASSWORDS.admin });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('wrong password and unknown email give the same 401', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email: 'admin@placement.dev', password: 'nope' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@placement.dev', password: 'nope' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  test('malformed body returns 400', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'not-an-email' })).status).toBe(400);
    const badJson = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(badJson.status).toBe(400);
  });

  test('failed logins are rate limited', async () => {
    const limited = buildApp({ loginMax: 3, applyMax: 1000 });
    const attempt = () => request(limited).post('/api/auth/login').send({ email: 'admin@placement.dev', password: 'wrong' });
    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });

  test('a forged token is rejected', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});

describe('admin', () => {
  let adminToken;
  beforeAll(async () => {
    adminToken = await login(app, 'admin@placement.dev', PASSWORDS.admin);
  });
  const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);

  test('created users are returned without the password hash', async () => {
    const res = await asAdmin(request(app).post('/api/admin/users')).send({
      name: 'New Student',
      email: 'new@college.edu',
      password: 'password123',
      role: 'student',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('password');

    const list = await asAdmin(request(app).get('/api/admin/users'));
    list.body.data.forEach((u) => expect(u).not.toHaveProperty('password'));
  });

  test('duplicate email returns 409, not 500', async () => {
    const res = await asAdmin(request(app).post('/api/admin/users')).send({
      name: 'Dup',
      email: 'new@college.edu',
      password: 'password123',
      role: 'student',
    });
    expect(res.status).toBe(409);
  });

  test('deactivation revokes an already-issued token immediately', async () => {
    const studentToken = await login(app, 'student3@college.edu', PASSWORDS.student);
    const me = () => request(app).get('/api/auth/me').set('Authorization', `Bearer ${studentToken}`);
    expect((await me()).status).toBe(200);

    const del = await asAdmin(request(app).delete(`/api/admin/users/${await userId('student3@college.edu')}`));
    expect(del.status).toBe(200);

    expect((await me()).status).toBe(401);
    const relogin = await request(app).post('/api/auth/login').send({ email: 'student3@college.edu', password: PASSWORDS.student });
    expect(relogin.status).toBe(401);
  });

  test('AI threshold must be between 0 and 1', async () => {
    expect((await asAdmin(request(app).put('/api/admin/ai/config')).send({ threshold: 5 })).status).toBe(400);
    const ok = await asAdmin(request(app).put('/api/admin/ai/config')).send({ threshold: 0.75 });
    expect(ok.body.data.threshold).toBe(0.75);
  });
});

describe('platform', () => {
  test('health check reports database status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.dependencies.database).toBe('ok');
  });

  test('unknown routes return JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('CORS only allows configured origins', async () => {
    const allowed = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    const blocked = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
