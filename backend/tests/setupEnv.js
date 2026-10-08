// Runs before every test file, before any app module is required.
// Values set here win over backend/.env because dotenv never overrides
// variables that already exist — so tests can never hit a real Gemini key.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://admin:secret@localhost:5432/placement_test';
process.env.JWT_SECRET = 'test-secret';
process.env.GEMINI_API_KEY = '';
process.env.REDIS_URL = '';
process.env.SEED_DEMO_DATA = 'true';
