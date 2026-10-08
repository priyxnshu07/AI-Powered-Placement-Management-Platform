const ruleBasedProvider = require('../../src/ai/ruleBasedProvider');

const job = { id: 1, required_skills: ['React', 'Node.js', 'SQL'], min_cgpa: 8 };

describe('ruleBasedProvider', () => {
  test('perfect skill match with CGPA met scores 1.0 / high', async () => {
    const r = await ruleBasedProvider.matchStudentToJob({ skills: ['react', 'NODE.JS', 'sql'], cgpa: 9 }, job);
    expect(r).toEqual({ score: 1, confidence: 'high', reason: 'Matched 3 of 3 required skills. CGPA requirement met.' });
  });

  test('CGPA below minimum loses the 40% CGPA weight', async () => {
    const r = await ruleBasedProvider.matchStudentToJob({ skills: ['React', 'Node.js', 'SQL'], cgpa: 7.5 }, job);
    expect(r.score).toBe(0.6);
    expect(r.reason).toContain('CGPA requirement not met');
  });

  test('partial skill overlap is proportional and case-insensitive', async () => {
    const r = await ruleBasedProvider.matchStudentToJob({ skills: [' react '], cgpa: 8 }, job);
    expect(r.score).toBe(0.6); // 0.4 + (1/3 * 0.6)
    expect(r.confidence).toBe('medium');
  });

  test('handles missing skills and string CGPA from the database', async () => {
    const r = await ruleBasedProvider.matchStudentToJob({ skills: null, cgpa: '8.2' }, job);
    expect(r.score).toBe(0.4);
    expect(r.confidence).toBe('low');
  });
});
