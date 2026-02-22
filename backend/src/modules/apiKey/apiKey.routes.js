import { Router } from 'express';
import { body, param, query } from 'express-validator';
import ApiKeyController from './apiKey.controller.js';
import { authenticate, asyncHandler } from '../../middlewares/index.js';
import validate from '../../middlewares/validate.js';

const router = Router();

// All routes require JWT authentication
router.use(authenticate);

// ─── Create ─────────────────────────────────────────────────────
router.post(
  '/',
  validate([
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 80 })
      .withMessage('Name is required (1-80 chars)'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('expiresAt must be a valid ISO 8601 date'),
    body('allowedIPs')
      .optional()
      .isArray()
      .withMessage('allowedIPs must be an array'),
    body('allowedIPs.*')
      .optional()
      .isIP()
      .withMessage('Each entry in allowedIPs must be a valid IP address'),
  ]),
  asyncHandler(ApiKeyController.create),
);

// ─── List ───────────────────────────────────────────────────────
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(ApiKeyController.list),
);

// ─── Revoke ─────────────────────────────────────────────────────
router.patch(
  '/:id/revoke',
  validate([param('id').isMongoId().withMessage('Invalid key ID')]),
  asyncHandler(ApiKeyController.revoke),
);

// ─── Delete ─────────────────────────────────────────────────────
router.delete(
  '/:id',
  validate([param('id').isMongoId().withMessage('Invalid key ID')]),
  asyncHandler(ApiKeyController.remove),
);

export default router;
