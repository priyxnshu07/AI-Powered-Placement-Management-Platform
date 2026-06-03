// SOLID-SRP: Only responsible for extracting structured data from text

/**
 * @interface IResumeParser
 */
module.exports = {
  /**
   * Parses raw text from a resume into a structured format.
   * @param {string} text - The raw text content of the resume.
   * @returns {Promise<{ skills: string[], experience: Object[], education: Object[] }>}
   */
  parseResume: async (text) => {
    throw new Error('Method not implemented');
  }
};
