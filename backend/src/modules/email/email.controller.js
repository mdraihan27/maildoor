import GmailService from './gmail.service.js';
import EmailLog from '../emailLog/emailLog.model.js';
import AuditService from '../audit/audit.service.js';
import { success } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class EmailController {
  /**
   * POST /api/email/send
   *
   * Send an email via the user's Gmail account using their App Password.
   * Authenticated via API key (x-api-key header).
   */
  async send(req, res) {
    const { to, subject, body, fromName, contentType } = req.body;
    const userId = req.user._id;
    const apiKeyId = req.apiKey?._id || null;

    // Extract request context
    const requestIP =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;
    const userAgent = req.headers['user-agent'] || null;

    // Create a pending email log
    const emailLog = await EmailLog.create({
      userId,
      apiKeyId,
      fromEmail: req.user.email,
      fromName: fromName || null,
      toEmail: to,
      subject,
      status: 'PENDING',
      requestIP,
      userAgent,
    });

    try {
      // Send via Gmail SMTP
      const result = await GmailService.sendEmail(userId, {
        to,
        subject,
        body,
        fromName,
        contentType,
      });

      // Mark log as sent
      await emailLog.markSent(result.messageId);

      // Fire-and-forget audit
      AuditService.log({
        actor: userId,
        action: 'EMAIL_SEND_SUCCESS',
        resource: 'EmailLog',
        resourceId: emailLog._id,
        meta: {
          to,
          subject: subject.substring(0, 100),
          messageId: result.messageId,
          apiKeyId,
        },
        ip: requestIP,
        userAgent,
      }).catch(() => {});

      return success(res, {
        message: 'Email sent successfully',
        email: {
          id: emailLog._id,
          messageId: result.messageId,
          from: result.from,
          to: result.to,
          subject,
          status: 'SENT',
          accepted: result.accepted,
          rejected: result.rejected,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Mark log as failed
      await emailLog.markFailed(err.message).catch(() => {});

      // Fire-and-forget audit
      AuditService.log({
        actor: userId,
        action: 'EMAIL_SEND_FAILED',
        resource: 'EmailLog',
        resourceId: emailLog._id,
        meta: {
          to,
          subject: subject.substring(0, 100),
          error: err.message,
          errorCode: err.code || 'ERR_UNKNOWN',
          apiKeyId,
        },
        ip: requestIP,
        userAgent,
      }).catch(() => {});

      logger.error('Email send failed', {
        userId,
        to,
        error: err.message,
        code: err.code,
      });

      // Re-throw — error handler will format the response
      throw err;
    }
  }
}

export default new EmailController();
