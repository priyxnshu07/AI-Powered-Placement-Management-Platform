/**
 * SOLID-SRP: Only responsible for orchestrating the matching process between students and jobs.
 * SOLID-OCP: Open for new AI providers (via IMatchingEngine interface) but closed for modification.
 * SOLID-LSP: Primary (Gemini) and Fallback (Rule-based) providers are drop-in replaceable.
 */
const geminiProvider = require('../ai/geminiProvider');
const ruleBasedProvider = require('../ai/ruleBasedProvider');

// SOLID-SRP: Only computes match scores. Nothing else.
// SOLID-DIP: Receives provider via constructor, not hardcoded

class AIMatchingService {
  /**
   * @param {Object} primaryProvider - Implementation of IMatchingEngine
   * @param {Object} fallbackProvider - Implementation of IMatchingEngine
   */
  constructor(primaryProvider, fallbackProvider) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  async getMatchScore(studentProfile, jobListing) {
    let result = null;
    let providerName = 'gemini';

    // Attempt primary (Gemini)
    result = await this.primaryProvider.matchStudentToJob(studentProfile, jobListing);

    // Fallback if primary failed or returned null
    if (!result) {
      result = await this.fallbackProvider.matchStudentToJob(studentProfile, jobListing);
      providerName = 'rule-based';
    }

    console.log(`[${new Date().toISOString()}] Match computed | student:${studentProfile.user_id} job:${jobListing.id} score:${result.score} confidence:${result.confidence} provider:${providerName}`);
    
    return result;
  }
}

// Factory instantiation
const aiMatchingService = new AIMatchingService(geminiProvider, ruleBasedProvider);

module.exports = aiMatchingService;
