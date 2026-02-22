import AuditLog from './audit.model.js';

/**
 * Repository layer — all direct DB access for AuditLog.
 * Optimised for write-heavy workloads.
 */
class AuditRepository {
  /**
   * Insert a single audit document.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async create(data) {
    return AuditLog.create(data);
  }

  /**
   * Bulk-insert many audit documents at once.
   * Uses unordered writes so one bad doc doesn't block the rest.
   * @param {object[]} docs
   * @returns {Promise<import('mongoose').InsertManyResult>}
   */
  async insertMany(docs) {
    return AuditLog.insertMany(docs, { ordered: false });
  }

  /**
   * Paginated query with arbitrary filter.
   */
  async list({ filter = {}, skip = 0, limit = 50, sort = { createdAt: -1 } } = {}) {
    const [docs, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return { docs, total };
  }

  async findByActor(actorId, { skip = 0, limit = 50 } = {}) {
    return this.list({ filter: { actor: actorId }, skip, limit });
  }

  async findByCategory(category, { skip = 0, limit = 50 } = {}) {
    return this.list({ filter: { category }, skip, limit });
  }

  async findByAction(action, { skip = 0, limit = 50 } = {}) {
    return this.list({ filter: { action }, skip, limit });
  }

  async findByIP(ip, { skip = 0, limit = 50 } = {}) {
    return this.list({ filter: { ip }, skip, limit });
  }

  async findByRequestId(requestId) {
    return AuditLog.find({ requestId }).sort({ createdAt: 1 }).lean();
  }
}

export default new AuditRepository();
