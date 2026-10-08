const crypto = require('crypto');
const config = require('../config');
const geminiProvider = require('../ai/geminiProvider');
const ruleBasedProvider = require('../ai/ruleBasedProvider');
const { parseMatchResult } = require('../ai/matchResult');
const { noopCache } = require('../cache/redisCache');

/**
 * SOLID-SRP: orchestrates matching (cache → primary → fallback). Nothing else.
 * SOLID-OCP: new engines plug in via the IMatchingEngine contract.
 * SOLID-DIP: engines and cache are injected, so tests swap in fakes.
 *
 * Why the cache: an LLM call costs money and 1–3 s of latency on the
 * request path. The score depends only on the student's skills/CGPA/branch
 * and the job's requirements, so identical inputs can reuse a prior answer.
 * The key is a hash of exactly those inputs: when a student edits their
 * skills or a recruiter edits a job, the key changes and the stale entry
 * is simply never read again (no explicit invalidation needed).
 */
class AIMatchingService {
  constructor({ primary, fallback, cache = noopCache, ttlSeconds = config.matchCacheTtlSeconds, logger = console }) {
    this.primary = primary;
    this.fallback = fallback;
    this.cache = cache;
    this.ttlSeconds = ttlSeconds;
    this.logger = logger;
    // Single-flight: concurrent requests for the same key share one LLM call.
    this.inFlight = new Map();
  }

  setCache(cache) {
    this.cache = cache || noopCache;
  }

  static cacheKey(studentProfile, jobListing, model = '') {
    const sortedLower = (list) => [...new Set((list || []).map((s) => String(s).trim().toLowerCase()))].sort();
    const fingerprint = JSON.stringify({
      v: 1,
      model,
      s: { skills: sortedLower(studentProfile.skills), cgpa: Number(studentProfile.cgpa), branch: studentProfile.branch || '' },
      j: {
        id: jobListing.id,
        title: jobListing.title || '',
        description: jobListing.description || '',
        skills: sortedLower(jobListing.required_skills),
        minCgpa: Number(jobListing.min_cgpa),
      },
    });
    return `match:${crypto.createHash('sha256').update(fingerprint).digest('hex')}`;
  }

  /**
   * @returns {Promise<{score:number, reason:string, confidence:string, provider:string, cached:boolean}>}
   */
  async getMatchScore(studentProfile, jobListing) {
    const key = AIMatchingService.cacheKey(studentProfile, jobListing, this.primary.model);

    const cached = await this.cache.getJSON(key);
    if (cached) {
      this.log(studentProfile, jobListing, { ...cached, cached: true });
      return { ...cached, cached: true };
    }

    if (this.inFlight.has(key)) return this.inFlight.get(key);

    const work = this.compute(studentProfile, jobListing, key).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, work);
    return work;
  }

  async compute(studentProfile, jobListing, key) {
    const primaryResult = parseMatchResult(await this.primary.matchStudentToJob(studentProfile, jobListing));

    if (primaryResult) {
      const result = { ...primaryResult, provider: this.primary.name };
      // Only LLM answers are cached. Rule-based scoring is microseconds, and
      // caching it would keep serving fallback scores after Gemini recovers.
      await this.cache.setJSON(key, result, this.ttlSeconds);
      this.log(studentProfile, jobListing, { ...result, cached: false });
      return { ...result, cached: false };
    }

    const fallbackResult = await this.fallback.matchStudentToJob(studentProfile, jobListing);
    const result = { ...fallbackResult, provider: this.fallback.name, cached: false };
    this.log(studentProfile, jobListing, result);
    return result;
  }

  log(studentProfile, jobListing, r) {
    this.logger.log(
      `[match] student=${studentProfile.user_id} job=${jobListing.id} score=${r.score} confidence=${r.confidence} provider=${r.provider}${r.cached ? ' (cache hit)' : ''}`
    );
  }
}

// Default wiring; server.js attaches the Redis cache at boot.
const aiMatchingService = new AIMatchingService({ primary: geminiProvider, fallback: ruleBasedProvider });

module.exports = aiMatchingService;
module.exports.AIMatchingService = AIMatchingService;
