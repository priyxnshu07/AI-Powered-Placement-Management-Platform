// SOLID-DIP: Controllers depend on this interface, not on a concrete repository implementation directly.

/**
 * @interface IUserRepository
 */
module.exports = {
  /**
   * Finds a user by their unique ID.
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  findById: async (id) => {
    throw new Error('Method not implemented');
  },

  /**
   * Finds a user by their email address.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  findByEmail: async (email) => {
    throw new Error('Method not implemented');
  },

  /**
   * Creates a new user record.
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  create: async (data) => {
    throw new Error('Method not implemented');
  },

  /**
   * Updates a student's profile data.
   * @param {string} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  updateProfile: async (id, data) => {
    throw new Error('Method not implemented');
  }
};
