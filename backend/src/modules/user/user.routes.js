import { Router } from 'express';
import { body, param, query } from 'express-validator';
import UserController from './user.controller.js';
import { authenticate, authorize, asyncHandler } from '../../middlewares/index.js';
import validate from '../../middlewares/validate.js';

const router = Router();

// ─── Authenticated user routes ──────────────────────────────────
router.get(
  '/me',
  authenticate,
  asyncHandler(UserController.me),
);

router.patch(
  '/me',
  authenticate,
  validate([
    body('name').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('profilePicture').optional().isURL(),
  ]),
  asyncHandler(UserController.updateMe),
);

// ─── App Password routes ───────────────────────────────────────
router.put(
  '/me/app-password',
  authenticate,
  validate([
    body('appPassword')
      .isString()
      .withMessage('App Password is required'),
  ]),
  asyncHandler(UserController.setAppPassword),
);

router.delete(
  '/me/app-password',
  authenticate,
  asyncHandler(UserController.removeAppPassword),
);

router.get(
  '/me/app-password/status',
  authenticate,
  asyncHandler(UserController.appPasswordStatus),
);

router.post(
  '/me/app-password/verify',
  authenticate,
  validate([
    body('appPassword')
      .isString()
      .withMessage('App Password is required'),
  ]),
  asyncHandler(UserController.verifyAppPassword),
);

// ─── Admin routes ───────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['ACTIVE', 'SUSPENDED']),
    query('role').optional().isIn(['USER', 'ADMIN', 'SUPERADMIN']),
  ]),
  asyncHandler(UserController.list),
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate([param('id').isMongoId()]),
  asyncHandler(UserController.getById),
);

router.patch(
  '/:id/role',
  authenticate,
  authorize('SUPERADMIN'),
  validate([
    param('id').isMongoId(),
    body('role').isIn(['USER', 'ADMIN', 'SUPERADMIN']),
  ]),
  asyncHandler(UserController.changeRole),
);

router.patch(
  '/:id/suspend',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate([param('id').isMongoId()]),
  asyncHandler(UserController.suspend),
);

router.patch(
  '/:id/reactivate',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  validate([param('id').isMongoId()]),
  asyncHandler(UserController.reactivate),
);

export default router;
