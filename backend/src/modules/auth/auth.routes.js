import { Router } from 'express';
import AuthController from './auth.controller.js';
import { asyncHandler, authenticate } from '../../middlewares/index.js';

const router = Router();

// ─── Google OAuth (no Passport – direct API) ────────────────────
router.get('/google', asyncHandler(AuthController.googleRedirect));
router.get('/google/callback', asyncHandler(AuthController.googleCallback));

// ─── Token management ───────────────────────────────────────────
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', authenticate, asyncHandler(AuthController.logout));

export default router;
