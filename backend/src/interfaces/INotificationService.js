// SOLID-SRP: Only responsible for sending notifications

/**
 * @interface INotificationService
 */
module.exports = {
  /**
   * Sends a notification to a specific user.
   * @param {string} userId - The unique identifier of the recipient.
   * @param {string} type - The type of notification (e.g., 'email', 'sms', 'push').
   * @param {string} message - The notification content.
   * @returns {Promise<void>}
   */
  send: async (userId, type, message) => {
    throw new Error('Method not implemented');
  }
};
