import axios from 'axios';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';
import { UnauthorizedError, AppError } from '../../utils/errors.js';

// ─── Google endpoint constants ──────────────────────────────────
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_TOKEN_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

const SCOPES = ['openid', 'email', 'profile'].join(' ');

const httpClient = axios.create({ timeout: 10_000 });

class GoogleOAuthService {
  /**
   * Build the Google consent screen URL.
   * @param {string} state  CSRF / state token
   * @returns {string}
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for Google tokens.
   * @param {string} code  Authorization code from callback
   * @returns {{ access_token, refresh_token, id_token, expires_in, token_type }}
   */
  async exchangeCodeForTokens(code) {
    try {
      const { data } = await httpClient.post(GOOGLE_TOKEN_URL, null, {
        params: {
          code,
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          redirect_uri: config.google.callbackUrl,
          grant_type: 'authorization_code',
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return data;
    } catch (err) {
      const msg = err.response?.data?.error_description || err.message;
      logger.error('Google token exchange failed', { error: msg });
      throw new UnauthorizedError(`Google token exchange failed: ${msg}`);
    }
  }

  /**
   * Fetch the authenticated user's profile from Google.
   * @param {string} accessToken  Google access token
   * @returns {{ sub, email, email_verified, name, picture }}
   */
  async getUserProfile(accessToken) {
    try {
      const { data } = await httpClient.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!data.email_verified) {
        throw new UnauthorizedError('Google email is not verified');
      }

      return {
        googleId: data.sub,
        email: data.email,
        name: data.name,
        profilePicture: data.picture || null,
        emailVerified: data.email_verified,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      const msg = err.response?.data?.error_description || err.message;
      logger.error('Google profile fetch failed', { error: msg });
      throw new UnauthorizedError(`Failed to retrieve Google profile: ${msg}`);
    }
  }

  /**
   * Revoke a Google token (access or refresh).
   * Best-effort — failures are logged but not thrown.
   * @param {string} token
   */
  async revokeToken(token) {
    try {
      await httpClient.post(GOOGLE_TOKEN_REVOKE_URL, null, {
        params: { token },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      logger.info('Google token revoked');
    } catch (err) {
      logger.warn('Google token revocation failed', { error: err.message });
    }
  }
}

export default new GoogleOAuthService();
