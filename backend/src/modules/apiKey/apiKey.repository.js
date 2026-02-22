import ApiKey from './apiKey.model.js';

/**
 * Repository layer — all direct DB access for ApiKey.
 * No business logic here; that belongs in the service.
 */
class ApiKeyRepository {
  /**
   * Persist a new API key document.
   * @param {object} data
   * @returns {object} Created document (toJSON)
   */
  async create(data) {
    const key = await ApiKey.create(data);
    return key.toJSON();
  }

  /**
   * Look up a key by its SHA-256 hash.
   * Returns the RAW document (no transform) so the hash is available for comparison.
   */
  async findByHash(hashedKey) {
    return ApiKey.findOne({ hashedKey }).lean();
  }

  async findById(id) {
    return ApiKey.findById(id).lean();
  }

  /**
   * Paginated list of keys belonging to a user.
   * Hash is stripped via toJSON transform.
   */
  async listByUser(userId, { skip = 0, limit = 20 } = {}) {
    const filter = { user: userId };
    const [docs, total] = await Promise.all([
      ApiKey.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .then((results) =>
          results.map((d) => {
            delete d.hashedKey; // strip in list view
            return d;
          }),
        ),
      ApiKey.countDocuments(filter),
    ]);
    return { docs, total };
  }

  /** Count active keys for a user (used to enforce per-user limit). */
  async countActiveByUser(userId) {
    return ApiKey.countDocuments({ user: userId, status: ApiKey.STATUSES.ACTIVE });
  }

  /** Mark a key as REVOKED. */
  async revoke(id) {
    return ApiKey.findByIdAndUpdate(
      id,
      { status: ApiKey.STATUSES.REVOKED },
      { new: true, runValidators: true },
    ).lean();
  }

  /** Hard-delete a key document. */
  async deleteById(id) {
    return ApiKey.findByIdAndDelete(id);
  }

  /** Non-blocking last-used timestamp update. */
  async touchLastUsed(id) {
    return ApiKey.updateOne({ _id: id }, { $set: { lastUsedAt: new Date() } });
  }
}

export default new ApiKeyRepository();
