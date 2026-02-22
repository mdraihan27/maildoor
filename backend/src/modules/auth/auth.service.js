import { UAParser } from 'ua-parser-js';

import GoogleOAuthService from './google.service.js';
import UserService from '../user/user.service.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../utils/jwt.js';
import { UnauthorizedError, BadRequestError } from '../../utils/errors.js';
import { generateRandomHex } from '../../utils/helpers.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';
import AuditService from '../audit/audit.service.js';

class AuthService {
  // ─── Redirect ───────────────────────────────────────────────

  /**
   * Generate the Google consent screen URL with a CSRF state token.
   * @returns {{ url: string, state: string }}
   */
  generateAuthUrl() {
    const state = generateRandomHex(32);
    const url = GoogleOAuthService.getAuthorizationUrl(state);
    return { url, state };
  }

  // ─── Callback ───────────────────────────────────────────────

  /**
   * Full Google OAuth callback flow:
   *  1. Exchange code → Google tokens
   *  2. Fetch Google user profile
   *  3. Upsert user + encrypt & store Google refresh token
   *  4. Record login metadata (IP, device, UA)
   *  5. Issue internal JWT access + refresh tokens
   *
   * @param {string} code   Authorization code from Google
   * @param {object} req    Express request (IP / headers extraction)
   * @returns {{ user, accessToken, refreshToken }}
   */
  async handleGoogleCallback(code, req) {
    if (!code) throw new BadRequestError('Authorization code is required');

    // 1. Exchange code for tokens
    const googleTokens = await GoogleOAuthService.exchangeCodeForTokens(code);

    // 2. Fetch profile
    const profile = await GoogleOAuthService.getUserProfile(googleTokens.access_token);

    // 3. Parse request metadata
    const loginMeta = this._extractLoginMeta(req);

    // 4. Upsert user (no refresh token stored anymore — using App Passwords)
    const user = await UserService.findOrCreateFromGoogle(profile, {
      loginMeta,
    });

    // 6. Issue internal JWTs
    const tokenPayload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    logger.info('User authenticated via Google', {
      userId: user._id,
      email: user.email,
      ip: loginMeta.ip,
    });

    // Fire-and-forget audit
    AuditService.log({
      actor: user._id,
      action: 'AUTH_GOOGLE_LOGIN',
      resource: 'User',
      resourceId: user._id,
      meta: { email: user.email, device: loginMeta.device },
      ip: loginMeta.ip,
      userAgent: loginMeta.userAgent,
    }).catch(() => {});

    return { user, accessToken, refreshToken };
  }

  // ─── Token refresh ──────────────────────────────────────────

  /**
   * Rotate internal JWT pair.
   * @param {string} token  Current refresh JWT
   * @returns {{ accessToken, refreshToken }}
   */
  async refreshTokens(token) {
    if (!token) throw new UnauthorizedError('Refresh token is required');

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await UserService.getById(decoded.sub);
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is suspended');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  // ─── Logout ─────────────────────────────────────────────────

  /**
   * Log the user out (clear cookies on client side).
   * @param {string} userId
   */
  async logout(userId) {
    AuditService.log({
      actor: userId,
      action: 'AUTH_LOGOUT',
      resource: 'User',
      resourceId: userId,
    }).catch(() => {});
  }

  // ─── Private helpers ────────────────────────────────────────

  /**
   * Extract IP, user-agent and parsed device info from the request.
   * @param {object} req
   * @returns {{ ip, userAgent, device }}
   */
  _extractLoginMeta(req) {
    const ip =
      req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;

    const userAgent = req.headers?.['user-agent'] || null;

    let device = null;
    if (userAgent) {
      const ua = new UAParser(userAgent);
      const browser = ua.getBrowser();
      const os = ua.getOS();
      const hw = ua.getDevice();
      device = [
        browser.name && `${browser.name} ${browser.version || ''}`.trim(),
        os.name && `${os.name} ${os.version || ''}`.trim(),
        hw.vendor && `${hw.vendor} ${hw.model || ''}`.trim(),
      ]
        .filter(Boolean)
        .join(' / ') || null;
    }

    return { ip, userAgent, device };
  }
}

export default new AuthService();
