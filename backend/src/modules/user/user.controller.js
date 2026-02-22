import UserService from './user.service.js';
import GmailService from '../email/gmail.service.js';
import { success, paginated } from '../../utils/response.js';
import { parsePagination } from '../../utils/helpers.js';

class UserController {
  /** GET /users/me */
  async me(req, res) {
    const user = await UserService.getById(req.user._id);
    return success(res, user);
  }

  /** PATCH /users/me */
  async updateMe(req, res) {
    const user = await UserService.updateProfile(req.user._id, req.body);
    return success(res, user);
  }

  /** GET /users/:id  (admin) */
  async getById(req, res) {
    const user = await UserService.getById(req.params.id);
    return success(res, user);
  }

  /** GET /users  (admin) */
  async list(req, res) {
    const pagination = parsePagination(req.query);
    const { status, role } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;

    const { docs, total } = await UserService.list(filter, pagination);
    return paginated(res, docs, pagination.page, pagination.limit, total);
  }

  /** PATCH /users/:id/role  (superadmin) */
  async changeRole(req, res) {
    const user = await UserService.changeRole(req.params.id, req.body.role);
    return success(res, user);
  }

  /** PATCH /users/:id/suspend  (admin) */
  async suspend(req, res) {
    const user = await UserService.suspend(req.params.id);
    return success(res, user);
  }

  /** PATCH /users/:id/reactivate  (admin) */
  async reactivate(req, res) {
    const user = await UserService.reactivate(req.params.id);
    return success(res, user);
  }

  // ─── App Password ──────────────────────────────────────────

  /** PUT /users/me/app-password — Set or update Gmail App Password */
  async setAppPassword(req, res) {
    const { appPassword } = req.body;
    const result = await UserService.setAppPassword(req.user._id, appPassword);
    return success(res, {
      message: 'App Password saved successfully',
      ...result,
    });
  }

  /** DELETE /users/me/app-password — Remove stored App Password */
  async removeAppPassword(req, res) {
    const result = await UserService.removeAppPassword(req.user._id);
    return success(res, {
      message: 'App Password removed successfully',
      ...result,
    });
  }

  /** GET /users/me/app-password/status — Check if App Password is configured */
  async appPasswordStatus(req, res) {
    const hasPassword = await UserService.hasAppPassword(req.user._id);
    return success(res, { hasAppPassword: hasPassword });
  }

  /** POST /users/me/app-password/verify — Verify App Password works */
  async verifyAppPassword(req, res) {
    const { appPassword } = req.body;
    const cleaned = appPassword.replace(/\s/g, '');

    const isValid = await GmailService.verifyAppPassword(req.user.email, cleaned);
    return success(res, {
      valid: isValid,
      message: isValid
        ? 'App Password is valid and can authenticate with Gmail'
        : 'App Password verification failed. Please check the password and ensure 2FA is enabled on your Google account.',
    });
  }
}

export default new UserController();
