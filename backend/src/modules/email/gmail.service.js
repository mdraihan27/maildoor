import nodemailer from 'nodemailer';
import User from '../user/user.model.js';
import logger from '../../utils/logger.js';
import { AppError, UnauthorizedError, BadRequestError } from '../../utils/errors.js';

// ─── Gmail SMTP constants ───────────────────────────────────────
const GMAIL_SMTP_HOST = 'smtp.gmail.com';
const GMAIL_SMTP_PORT = 587;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// ─── Common SMTP error mappings ─────────────────────────────────
const SMTP_ERROR_MAP = {
  EAUTH: {
    code: 'ERR_SMTP_AUTH_FAILED',
    message: 'Gmail authentication failed — your App Password may be incorrect or revoked. Please update it in your dashboard.',
    status: 401,
  },
  ESOCKET: {
    code: 'ERR_SMTP_CONNECTION',
    message: 'Could not connect to Gmail SMTP server. Please try again later.',
    status: 502,
  },
  ECONNECTION: {
    code: 'ERR_SMTP_CONNECTION',
    message: 'Connection to Gmail SMTP server failed. This may be a temporary network issue.',
    status: 502,
  },
  EENVELOPE: {
    code: 'ERR_INVALID_RECIPIENT',
    message: 'Invalid recipient email address. Please check the "to" field.',
    status: 400,
  },
  EMESSAGE: {
    code: 'ERR_MESSAGE_BUILD',
    message: 'Failed to build the email message. Please check your email content.',
    status: 400,
  },
};

// ─── Service ────────────────────────────────────────────────────

class GmailService {
  // ─── Public API ─────────────────────────────────────────────

  /**
   * Send an email through Gmail SMTP on behalf of a user.
   *
   * Flow:
   *  1. Retrieve user's encrypted App Password from DB
   *  2. Decrypt it via Mongoose instance method
   *  3. Create a nodemailer transporter with user's Gmail + App Password
   *  4. Send the email via SMTP
   *  5. Return the message ID and delivery info
   *
   * App Passwords are decrypted in-memory only and never logged.
   *
   * @param {string} userId       Mongo ObjectId of the sending user
   * @param {object} params
   * @param {string} params.to    Recipient email
   * @param {string} params.subject
   * @param {string} params.body  Plain-text or HTML body
   * @param {string} [params.fromName]  Display name for the From header
   * @param {'text'|'html'} [params.contentType='html']
   * @returns {Promise<object>}   Email send result with messageId
   */
  async sendEmail(userId, { to, subject, body, fromName = null, contentType = 'html' }) {
    // 1. Load user with encrypted app password
    const userDoc = await this._getUserDocument(userId);

    // 2. Decrypt app password (instance method on Mongoose document)
    const appPassword = userDoc.getDecryptedAppPassword();
    if (!appPassword) {
      throw new BadRequestError(
        'No Gmail App Password configured. Please add your App Password in the dashboard before sending emails.',
      );
    }

    // 3. Create transporter with user's credentials
    const transporter = this._createTransporter(userDoc.email, appPassword);

    // 4. Build email options
    const mailOptions = {
      from: fromName ? `${fromName} <${userDoc.email}>` : userDoc.email,
      to,
      subject,
      [contentType === 'html' ? 'html' : 'text']: body,
    };

    // 5. Send with retry logic
    const result = await this._sendWithRetry(transporter, mailOptions);

    logger.info('Email sent via Gmail SMTP', {
      userId,
      to,
      messageId: result.messageId,
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      from: userDoc.email,
      to,
    };
  }

  // ─── Transporter creation ──────────────────────────────────

  /**
   * Create a nodemailer SMTP transporter for a specific user's Gmail.
   *
   * @param {string} email       User's Gmail address
   * @param {string} appPassword Decrypted App Password
   * @returns {import('nodemailer').Transporter}
   */
  _createTransporter(email, appPassword) {
    return nodemailer.createTransport({
      host: GMAIL_SMTP_HOST,
      port: GMAIL_SMTP_PORT,
      secure: false, // STARTTLS
      auth: {
        user: email,
        pass: appPassword,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  // ─── Send with retry ──────────────────────────────────────

  /**
   * Send an email with exponential back-off retry for transient errors.
   *
   * @param {import('nodemailer').Transporter} transporter
   * @param {object} mailOptions
   * @returns {Promise<object>} nodemailer send result
   */
  async _sendWithRetry(transporter, mailOptions) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const info = await transporter.sendMail(mailOptions);
        return info;
      } catch (err) {
        lastError = err;

        // Don't retry auth errors — they won't change
        if (err.code === 'EAUTH') break;

        // Don't retry envelope/message errors — they are client errors
        if (err.code === 'EENVELOPE' || err.code === 'EMESSAGE') break;

        // Don't retry if we've exhausted attempts
        if (attempt === MAX_RETRIES) break;

        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn('Gmail SMTP send attempt failed, retrying', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          errorCode: err.code,
          errorMessage: err.message,
        });

        await this._sleep(delay);
      }
    }

    // All attempts failed — map to a user-friendly error
    return this._handleSmtpError(lastError);
  }

  // ─── Error handling ────────────────────────────────────────

  /**
   * Map SMTP errors to user-friendly AppErrors with specific codes.
   * @param {Error} err
   */
  _handleSmtpError(err) {
    const mapped = SMTP_ERROR_MAP[err.code];

    if (mapped) {
      logger.error('Gmail SMTP error (mapped)', {
        smtpCode: err.code,
        errorCode: mapped.code,
        message: err.message,
      });

      if (mapped.status === 401) {
        throw new UnauthorizedError(mapped.message);
      }
      if (mapped.status === 400) {
        throw new BadRequestError(mapped.message);
      }
      throw new AppError(mapped.message, mapped.status, { code: mapped.code });
    }

    // Gmail-specific rejection messages
    if (err.responseCode) {
      const smtpMsg = err.response || err.message;
      logger.error('Gmail SMTP rejection', {
        responseCode: err.responseCode,
        response: smtpMsg,
      });

      // 550 = mailbox not found / rejected
      if (err.responseCode === 550) {
        throw new BadRequestError(
          'Recipient address rejected by Gmail. Please verify the email address.',
        );
      }

      // 552 = message too large
      if (err.responseCode === 552) {
        throw new BadRequestError('Email message is too large. Please reduce the content size.');
      }

      // 421 = too many connections / temporary
      if (err.responseCode === 421) {
        throw new AppError(
          'Gmail is temporarily rejecting connections. Please try again in a few minutes.',
          429,
          { code: 'ERR_GMAIL_RATE_LIMIT' },
        );
      }

      // 454 = too many login attempts
      if (err.responseCode === 454) {
        throw new AppError(
          'Too many login attempts to Gmail. Please try again later.',
          429,
          { code: 'ERR_GMAIL_RATE_LIMIT' },
        );
      }

      throw new AppError(
        `Gmail SMTP error (${err.responseCode}): ${smtpMsg}`,
        502,
        { code: 'ERR_GMAIL_SMTP' },
      );
    }

    // Unknown error
    logger.error('Gmail SMTP unknown error', {
      code: err.code,
      message: err.message,
    });

    throw new AppError(
      'Failed to send email via Gmail. Please check your App Password and try again.',
      502,
      { code: 'ERR_GMAIL_SEND' },
    );
  }

  // ─── Helpers ───────────────────────────────────────────────

  /**
   * Retrieve the user's Mongoose document with the encrypted app password selected.
   * @param {string} userId
   * @returns {Promise<import('mongoose').Document>}
   */
  async _getUserDocument(userId) {
    const userDoc = await User.findById(userId)
      .select('+encryptedAppPassword');

    if (!userDoc) {
      throw new AppError('User not found', 404, { code: 'ERR_NOT_FOUND' });
    }

    if (userDoc.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is suspended');
    }

    return userDoc;
  }

  /**
   * Verify that an App Password works by attempting an SMTP connection.
   * @param {string} email
   * @param {string} appPassword
   * @returns {Promise<boolean>}
   */
  async verifyAppPassword(email, appPassword) {
    const transporter = this._createTransporter(email, appPassword);
    try {
      await transporter.verify();
      return true;
    } catch (err) {
      logger.warn('App Password verification failed', {
        email,
        errorCode: err.code,
        message: err.message,
      });
      return false;
    } finally {
      transporter.close();
    }
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
