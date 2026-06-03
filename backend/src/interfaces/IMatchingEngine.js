// SOLID-OCP: New AI providers implement this — core logic never changes
// SOLID-LSP: All providers are drop-in replaceable

/**
 * @interface IMatchingEngine
 */
module.exports = {
  /**
   * Matches a student profile against a job listing using AI embeddings/logic.
   * @param {Object} studentProfile - The structured profile of the student.
   * @param {Object} jobListing - The job listing requirements and description.
   * @returns {Promise<{ score: number, reason: string, confidence: 'high'|'medium'|'low' }>}
   */
  matchStudentToJob: async (studentProfile, jobListing) => {
    throw new Error('Method not implemented');
  }
};
