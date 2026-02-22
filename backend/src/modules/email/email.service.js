import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

let transporter;

/**
 * Lazily initialise the SMTP transporter.
 * Falls back to a JSON-logging stub when SMTP is not configured.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn('SMTP credentials not set – emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  return transporter;
};

class EmailService {
  /**
   * Send a single email.
   * @param {object} opts
   * @param {string} opts.to       Recipient address
   * @param {string} opts.subject  Subject line
   * @param {string} opts.html     HTML body
   * @param {string} [opts.text]   Plain-text fallback
   */
  async send({ to, subject, html, text }) {
    const transport = getTransporter();

    const envelope = {
      from: `${config.app.name} <${config.smtp.from}>`,
      to,
      subject,
      html,
      ...(text && { text }),
    };

    if (!transport) {
      logger.info('Email (no transport)', { to, subject });
      return null;
    }

    try {
      const info = await transport.sendMail(envelope);
      logger.info('Email sent', { messageId: info.messageId, to, subject });
      return info;
    } catch (err) {
      logger.error('Email send failed', { error: err.message, to, subject });
      throw err;
    }
  }

  /** Convenience: welcome email after first Google sign-in. */
  async sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: `Welcome to ${config.app.name}`,
      html: `
        <h1>Welcome, ${user.name}!</h1>
        <p>Your account has been created successfully via Google.</p>
        <p>Get started by visiting <a href="${config.app.frontendUrl}">${config.app.name}</a>.</p>
      `,
    });
  }

  /** Convenience: API key created notification. */
  async sendApiKeyCreated(user, keyName) {
    return this.send({
      to: user.email,
      subject: `New API key created: ${keyName}`,
      html: `
        <p>Hi ${user.name},</p>
        <p>A new API key "<strong>${keyName}</strong>" was created for your account.</p>
        <p>If this wasn't you, please revoke it immediately.</p>
      `,
    });
  }
}

export default new EmailService();
