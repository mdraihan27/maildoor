import AuthService from './auth.service.js';
import { success } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import config from '../../config/index.js';

/** Cookie options factory — uses centralized config.cookie. */
const refreshCookieOpts = () => ({
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: config.cookie.path,
});

class AuthController {
  /**
   * GET /auth/google
   * Generates Google consent URL and redirects the browser.
   */
  async googleRedirect(req, res) {
    const { url, state } = AuthService.generateAuthUrl();

    // Store state in a short-lived httpOnly cookie for CSRF validation
    res.cookie('oauth_state', state, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 10 * 60 * 1000, // 10 min
      path: config.cookie.path,
    });

    return res.redirect(url);
  }

  /**
   * GET /auth/google/callback
   * Google redirects here after consent. Exchanges code → tokens → user.
   */
  async googleCallback(req, res) {
    const { code, state } = req.query;
    const savedState = req.cookies?.oauth_state;

    // CSRF check
    if (!state || !savedState || state !== savedState) {
      throw new BadRequestError('Invalid OAuth state — possible CSRF');
    }

    // Clear one-time state cookie
    res.clearCookie('oauth_state', { path: '/api/auth' });

    const { accessToken, refreshToken } = await AuthService.handleGoogleCallback(code, req);

    // Set internal refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshCookieOpts());

    // Redirect to frontend with access token
    const redirectUrl = new URL('/auth/callback', config.app.frontendUrl);
    redirectUrl.searchParams.set('token', accessToken);
    return res.redirect(redirectUrl.toString());
  }

  /**
   * POST /auth/refresh
   * Rotate internal JWT pair.
   */
  async refresh(req, res) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await AuthService.refreshTokens(token);

    res.cookie('refreshToken', tokens.refreshToken, refreshCookieOpts());
    return success(res, { accessToken: tokens.accessToken });
  }

  /**
   * POST /auth/logout
   * Clear refresh cookie + persisted token.
   */
  async logout(req, res) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
    await AuthService.logout(req.user._id);
    return success(res, { message: 'Logged out successfully' });
  }
}

export default new AuthController();
