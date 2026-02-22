import axios from 'axios';
import User from '../user/user.model.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';
import { AppError, UnauthorizedError } from '../../utils/errors.js';

// ─── Google API constants ───────────────────────────────────────
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Dedicated HTTP client for Google APIs.
 * Short timeout — Gmail sends are fast; we don't want to block long.
 */
const httpClient = axios.create({ timeout: 15_000 });

// ─── Service ────────────────────────────────────────────────────

class GmailService {
  // ─── Public API ─────────────────────────────────────────────

  /**
   * Send an email through the Gmail API on behalf of a user.
   *
   * Flow:
   *  1. Retrieve user's encrypted Google refresh token from DB
   *  2. Decrypt it via Mongoose instance method
   *  3. Exchange refresh token for a short-lived access token
   *  4. Build RFC 2822 MIME message → base64url encode
   *  5. POST to Gmail send endpoint
   *  6. Return the Gmail message ID
   *
   * Access tokens are NEVER stored or logged.
   *
   * @param {string} userId       Mongo ObjectId of the sending user
   * @param {object} params
   * @param {string} params.to    Recipient email
   * @param {string} params.subject
   * @param {string} params.body  Plain-text or HTML body
   * @param {string} [params.fromName]  Display name for the From header
   * @param {'text'|'html'} [params.contentType='html']
   * @returns {Promise<string>}   Gmail message ID
   */
  async sendEmail(userId, { to, subject, body, fromName = null, contentType = 'html' }) {
    // 1. Load user with encrypted refresh token
    const userDoc = await this._getUserDocument(userId);

    // 2. Decrypt refresh token (instance method on Mongoose document)
    const refreshToken = userDoc.getDecryptedRefreshToken();
    if (!refreshToken) {
      throw new UnauthorizedError(
        'No Google refresh token found — user must re-authenticate with Google',
      );
    }

    // 3. Get a fresh access token (never stored)
    const accessToken = await this._refreshAccessToken(refreshToken);

    // 4. Build the MIME message
    const senderEmail = userDoc.email;
    const mimeMessage = this._buildMimeMessage({
      from: fromName ? `${fromName} <${senderEmail}>` : senderEmail,
      to,
      subject,
      body,
      contentType,
    });

    // 5. Base64url encode
    const encodedMessage = this._base64UrlEncode(mimeMessage);

    // 6. Send via Gmail API (with retry)
    const gmailMessageId = await this._sendWithRetry(accessToken, encodedMessage);

    logger.info('Email sent via Gmail', {
      userId,
      to,
      gmailMessageId,
    });

    return gmailMessageId;
  }

  // ─── Token management ──────────────────────────────────────

  /**
   * Exchange a Google refresh token for a new access token.
   * The access token is returned in-memory only — never persisted.
   *
   * @param {string} refreshToken  Decrypted Google refresh token
   * @returns {Promise<string>}    Short-lived access token
   */
  async _refreshAccessToken(refreshToken) {
    try {
      const { data } = await httpClient.post(GOOGLE_TOKEN_URL, null, {
        params: {
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!data.access_token) {
        throw new Error('Google returned no access_token');
      }

      return data.access_token;
    } catch (err) {
      // If Google explicitly revoked the token, surface a clear error
      const googleError = err.response?.data?.error;
      if (googleError === 'invalid_grant') {
        logger.warn('Google refresh token invalid/revoked', { error: googleError });
        throw new UnauthorizedError(
          'Google refresh token has been revoked — user must re-authenticate',
        );
      }

      const msg = err.response?.data?.error_description || err.message;
      logger.error('Google access-token refresh failed', { error: msg });
      throw new AppError(`Failed to refresh Google access token: ${msg}`, 502, {
        code: 'ERR_GOOGLE_TOKEN_REFRESH',
      });
    }
  }

  // ─── MIME construction ─────────────────────────────────────

  /**
   * Build an RFC 2822–compliant MIME message string.
   *
   * @param {object} opts
   * @param {string} opts.from
   * @param {string} opts.to
   * @param {string} opts.subject
   * @param {string} opts.body
   * @param {'text'|'html'} opts.contentType
   * @returns {string}
   */
  _buildMimeMessage({ from, to, subject, body, contentType }) {
    const mimeType = contentType === 'html' ? 'text/html' : 'text/plain';

    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${this._encodeSubject(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: ${mimeType}; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      `Date: ${new Date().toUTCString()}`,
      '', // blank line between headers and body
    ];

    // Encode body content as base64 to safely handle UTF-8 / special chars
    const encodedBody = Buffer.from(body, 'utf-8').toString('base64');

    return headers.join('\r\n') + '\r\n' + encodedBody;
  }

  /**
   * Encode subject line for RFC 2047 if it contains non-ASCII characters.
   * @param {string} subject
   * @returns {string}
   */
  _encodeSubject(subject) {
    // eslint-disable-next-line no-control-regex
    if (/^[\x00-\x7F]*$/.test(subject)) return subject;
    const encoded = Buffer.from(subject, 'utf-8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
  }

  // ─── Gmail API call ────────────────────────────────────────

  /**
   * POST the encoded message to Gmail with exponential back-off retry.
   *
   * @param {string} accessToken   Short-lived Google access token
   * @param {string} encodedMsg    Base64url-encoded MIME message
   * @returns {Promise<string>}    Gmail message ID
   */
  async _sendWithRetry(accessToken, encodedMsg) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await httpClient.post(
          GMAIL_SEND_URL,
          { raw: encodedMsg },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return data.id; // Gmail message ID
      } catch (err) {
        lastError = err;

        const status = err.response?.status;

        // Don't retry client errors (except 429 rate-limit)
        if (status && status >= 400 && status < 500 && status !== 429) {
          break;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === MAX_RETRIES) break;

        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn('Gmail send attempt failed, retrying', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          status,
        });

        await this._sleep(delay);
      }
    }

    // All attempts failed
    const status = lastError.response?.status;
    const googleMsg =
      lastError.response?.data?.error?.message ||
      lastError.response?.data?.error_description ||
      lastError.message;

    logger.error('Gmail send failed after retries', {
      status,
      error: googleMsg,
    });

    if (status === 401 || status === 403) {
      throw new UnauthorizedError(
        'Gmail API authorization failed — user may need to re-authenticate',
      );
    }

    throw new AppError(`Gmail send failed: ${googleMsg}`, status || 502, {
      code: 'ERR_GMAIL_SEND',
    });
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Retrieve the user's Mongoose document with the encrypted refresh token selected.
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document>}
   */
  async _getUserDocument(userId) {
    const userDoc = await User.findById(userId)
      .select('+encryptedRefreshToken +refreshTokenExpiry');

    if (!userDoc) {
      throw new AppError('User not found', 404, { code: 'ERR_NOT_FOUND' });
    }

    if (userDoc.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is suspended');
    }

    // Check if the Google refresh token has expired (if we track expiry)
    if (userDoc.isRefreshTokenExpired()) {
      throw new UnauthorizedError(
        'Google refresh token has expired — user must re-authenticate',
      );
    }

    return userDoc;
  }

  /**
   * Base64url encode a string (RFC 4648 §5).
   * Gmail API requires base64url, not standard base64.
   *
   * @param {string} str
   * @returns {string}
   */
  _base64UrlEncode(str) {
    return Buffer.from(str, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new GmailService();
