import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import UserRepository from '../modules/user/user.repository.js';

/**
 * Authenticate request via Bearer token.
 * Populates req.user with the hydrated user document.
 */
export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await UserRepository.findById(decoded.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is inactive or not found');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize by role(s).
 * Usage: authorize('admin', 'superadmin')
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ForbiddenError('Insufficient permissions'));
  }
  next();
};
