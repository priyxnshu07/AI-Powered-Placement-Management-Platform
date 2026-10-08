const { badRequest } = require('../errors');

/**
 * Validates req[source] against a zod schema and replaces it with the parsed
 * result. zod objects strip unknown keys by default, so this is also the
 * mass-assignment guard: fields a role is not allowed to set never reach a
 * controller.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.') || source,
      message: i.message,
    }));
    return next(badRequest('Validation failed', details));
  }
  // req.query is a getter-only property in some Express versions; params/body are assignable.
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  return next();
};

module.exports = validate;
