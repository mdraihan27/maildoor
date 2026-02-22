/**
 * Wraps async route handlers so rejected promises are forwarded to next().
 * Eliminates try/catch boilerplate in every controller.
 *
 * @param {Function} fn  Async (req, res, next) => ...
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
