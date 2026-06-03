// SOLID-DIP: Controllers depend on this interface, not on a concrete repository implementation directly.

/**
 * @interface IJobRepository
 */
module.exports = {
  /**
   * Finds a job by its unique ID.
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  findById: async (id) => {
    throw new Error('Method not implemented');
  },

  /**
   * Retrieves all job listings.
   * @returns {Promise<Object[]>}
   */
  findAll: async () => {
    throw new Error('Method not implemented');
  },

  /**
   * Finds jobs for which the student is eligible based on their profile.
   * @param {Object} studentProfile 
   * @returns {Promise<Object[]>}
   */
  findEligibleForStudent: async (studentProfile) => {
    throw new Error('Method not implemented');
  },

  /**
   * Persists a new job listing.
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  create: async (data) => {
    throw new Error('Method not implemented');
  }
};
