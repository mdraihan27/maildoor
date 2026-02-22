import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const { secret, accessExpiresIn, refreshExpiresIn } = config.jwt;

/**
 * Sign an access token.
 * @param {object} payload  Claims to embed (e.g. { sub, email, role })
 * @returns {string}
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn: accessExpiresIn });

/**
 * Sign a refresh token.
 * @param {object} payload
 * @returns {string}
 */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn: refreshExpiresIn });

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {object}  Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
export const verifyToken = (token) => jwt.verify(token, secret);
