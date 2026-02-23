import AuditService from './audit.service.js';
import { paginated } from '../../utils/response.js';
import { parsePagination } from '../../utils/helpers.js';

class AuditController {
  /** GET /audit/me — own audit logs */
  async myLogs(req, res) {
    const pagination = parsePagination(req.query);
    const { docs, total } = await AuditService.listByActor(req.user._id, pagination);
    return paginated(res, docs, pagination.page, pagination.limit, total);
  }

  /** GET /audit — all logs (admin) */
  async list(req, res) {
    const pagination = parsePagination(req.query);
    const { action, actor, category, ip, outcome } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (actor) filter.actor = actor;
    if (category) filter.category = category;
    if (ip) filter.ip = ip;
    if (outcome) filter.outcome = outcome; 

    const { docs, total } = await AuditService.list(filter, pagination);
    return paginated(res, docs, pagination.page, pagination.limit, total);
  }
}

export default new AuditController();
