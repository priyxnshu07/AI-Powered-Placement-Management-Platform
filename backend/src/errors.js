/**
 * Typed HTTP errors. Controllers throw these; the central error handler turns
 * them into consistent JSON responses. Anything that is NOT an HttpError is
 * treated as an unexpected 500 and its message is hidden in production.
 */
class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
    this.expose = true;
  }
}

const badRequest = (message, details) => new HttpError(400, message, details);
const forbidden = (message = 'Forbidden') => new HttpError(403, message);
const notFound = (message = 'Not found') => new HttpError(404, message);
const conflict = (message) => new HttpError(409, message);

module.exports = { HttpError, badRequest, forbidden, notFound, conflict };
