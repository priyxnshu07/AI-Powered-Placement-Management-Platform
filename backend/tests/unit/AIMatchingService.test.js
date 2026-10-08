const { AIMatchingService } = require('../../src/services/AIMatchingService');

const student = { user_id: 1, skills: ['Python', 'SQL'], cgpa: 8.5, branch: 'CSE' };
const job = { id: 3, title: 'Data Analyst', description: '', required_skills: ['SQL'], min_cgpa: 7 };

const geminiResult = { score: 0.9, reason: 'Good fit.', confidence: 'high' };
const ruleResult = { score: 0.7, reason: 'Matched 1 of 1 required skills.', confidence: 'medium' };

function memoryCache() {
  const store = new Map();
  return {
    name: 'memory',
    store,
    getJSON: jest.fn(async (k) => (store.has(k) ? store.get(k) : null)),
    setJSON: jest.fn(async (k, v) => void store.set(k, v)),
  };
}

function build({ primaryImpl = async () => geminiResult, cache = memoryCache() } = {}) {
  const primary = { name: 'gemini', model: 'm', matchStudentToJob: jest.fn(primaryImpl) };
  const fallback = { name: 'rule-based', matchStudentToJob: jest.fn(async () => ruleResult) };
  const service = new AIMatchingService({ primary, fallback, cache, logger: { log: () => {} } });
  return { service, primary, fallback, cache };
}

describe('AIMatchingService', () => {
  test('uses the primary engine and records which provider answered', async () => {
    const { service, fallback } = build();
    await expect(service.getMatchScore(student, job)).resolves.toEqual({ ...geminiResult, provider: 'gemini', cached: false });
    expect(fallback.matchStudentToJob).not.toHaveBeenCalled();
  });

  test('falls back when the primary returns null', async () => {
    const { service } = build({ primaryImpl: async () => null });
    await expect(service.getMatchScore(student, job)).resolves.toMatchObject({ ...ruleResult, provider: 'rule-based' });
  });

  test('falls back when the primary returns malformed output', async () => {
    const { service } = build({ primaryImpl: async () => ({ score: 'high', reason: '' }) });
    await expect(service.getMatchScore(student, job)).resolves.toMatchObject({ provider: 'rule-based' });
  });

  test('second identical request is a cache hit and makes no LLM call', async () => {
    const { service, primary } = build();
    await service.getMatchScore(student, job);
    const second = await service.getMatchScore(student, job);

    expect(second).toMatchObject({ provider: 'gemini', cached: true });
    expect(primary.matchStudentToJob).toHaveBeenCalledTimes(1);
  });

  test('fallback results are NOT cached, so Gemini is retried once it recovers', async () => {
    let geminiUp = false;
    const { service, primary, cache } = build({ primaryImpl: async () => (geminiUp ? geminiResult : null) });

    await service.getMatchScore(student, job);
    expect(cache.setJSON).not.toHaveBeenCalled();

    geminiUp = true;
    await expect(service.getMatchScore(student, job)).resolves.toMatchObject({ provider: 'gemini' });
    expect(primary.matchStudentToJob).toHaveBeenCalledTimes(2);
  });

  test('concurrent identical requests share a single LLM call (single-flight)', async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    const { service, primary } = build({ primaryImpl: async () => { await gate; return geminiResult; } });

    const calls = Array.from({ length: 5 }, () => service.getMatchScore(student, job));
    release();
    const results = await Promise.all(calls);

    expect(primary.matchStudentToJob).toHaveBeenCalledTimes(1);
    results.forEach((r) => expect(r.score).toBe(0.9));
  });

  describe('cacheKey', () => {
    const key = (s, j) => AIMatchingService.cacheKey(s, j, 'm');

    test('ignores skill order, case and duplicates', () => {
      expect(key({ ...student, skills: ['sql', 'PYTHON', 'Python'] }, job)).toBe(key(student, job));
    });

    test('changes when the student edits their skills (automatic invalidation)', () => {
      expect(key({ ...student, skills: ['Python', 'SQL', 'Tableau'] }, job)).not.toBe(key(student, job));
    });

    test('changes when the recruiter edits the job requirements', () => {
      expect(key(student, { ...job, min_cgpa: 8 })).not.toBe(key(student, job));
    });

    test('changes when the model changes', () => {
      expect(AIMatchingService.cacheKey(student, job, 'other-model')).not.toBe(key(student, job));
    });
  });
});
