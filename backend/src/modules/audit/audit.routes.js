import { Router } from 'express';
import { query } from 'express-validator';
import AuditController from './audit.controller.js';
import { authenticate, authorize, asyncHandler } from '../../middlewares/index.js';
import validate from '../../middlewares/validate.js';

const router = Router();

router.use(authenticate);

// ─── Own logs ───────────────────────────────────────────────────
router.get(
  '/me',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(AuditController.myLogs),
);

// ─── Admin: full log access ─────────────────────────────────────
router.get(
  '/',
  authorize('ADMIN', 'SUPERADMIN'),
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString(),
    query('actor').optional().isMongoId(),
    query('category').optional().isString(),
    query('ip').optional().isString(),
    query('outcome').optional().isIn(['SUCCESS', 'FAILURE']),
  ]),
  asyncHandler(AuditController.list),
);

export default router;
