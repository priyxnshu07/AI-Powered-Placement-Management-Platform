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
   * Finds a user by email, including the password hash. Only for login.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  findByEmailWithPassword: async (email) => {
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
   * Creates or updates the student-editable profile fields (never is_placed).
   * @param {string} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  upsertProfile: async (id, data) => {
    throw new Error('Method not implemented');
  }
};
