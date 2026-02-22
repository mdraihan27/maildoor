import { Router } from 'express';
import { body } from 'express-validator';
import EmailController from './email.controller.js';
import { authenticateApiKey, apiKeyRateLimiter, asyncHandler } from '../../middlewares/index.js';
import validate from '../../middlewares/validate.js';

const router = Router();

// All email routes require API key authentication
router.use(authenticateApiKey);
router.use(apiKeyRateLimiter());

// ─── Send Email ─────────────────────────────────────────────────
router.post(
  '/send',
  validate([
    body('to')
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid recipient email address is required'),
    body('subject')
      .isString()
      .trim()
      .isLength({ min: 1, max: 998 })
      .withMessage('Subject is required (1-998 chars)'),
    body('body')
      .isString()
      .isLength({ min: 1, max: 50000 })
      .withMessage('Body is required (max 50,000 chars)'),
    body('fromName')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 120 })
      .withMessage('From name cannot exceed 120 characters'),
    body('contentType')
      .optional()
      .isIn(['text', 'html'])
      .withMessage('contentType must be "text" or "html"'),
  ]),
  asyncHandler(EmailController.send),
);

export default router;
