import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware that runs after express-validator checks.
 * Throws a structured ValidationError if any checks failed.
 */
const validate = (validations) => async (req, _res, next) => {
  // Run all validations
  await Promise.all(validations.map((v) => v.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const mapped = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
    value: e.value,
  }));

  next(new ValidationError(mapped));
};

export default validate;
