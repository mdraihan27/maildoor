import UserService from './user.service.js';
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
}

export default new UserController();
