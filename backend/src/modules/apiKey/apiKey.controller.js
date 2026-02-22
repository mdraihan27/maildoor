import ApiKeyService from './apiKey.service.js';
import { success, created, noContent, paginated } from '../../utils/response.js';
import { parsePagination } from '../../utils/helpers.js';

class ApiKeyController {
  /**
   * POST /api-keys
   * Returns the plaintext key exactly once in the response body.
   */
  async create(req, res) {
    const result = await ApiKeyService.create(req.user._id, req.body);
    return created(res, {
      _id: result._id,
      name: result.name,
      key: result.key, // plaintext — shown ONCE
      prefix: result.prefix,
      suffix: result.suffix,
      status: result.status,
      expiresAt: result.expiresAt,
      createdAt: result.createdAt,
    });
  }

  /** GET /api-keys */
  async list(req, res) {
    const pagination = parsePagination(req.query);
    const { docs, total } = await ApiKeyService.listByUser(req.user._id, pagination);
    return paginated(res, docs, pagination.page, pagination.limit, total);
  }

  /** PATCH /api-keys/:id/revoke */
  async revoke(req, res) {
    const key = await ApiKeyService.revoke(req.user._id, req.params.id);
    return success(res, key);
  }

  /** DELETE /api-keys/:id */
  async remove(req, res) {
    await ApiKeyService.remove(req.user._id, req.params.id);
    return noContent(res);
  }
}

export default new ApiKeyController();
