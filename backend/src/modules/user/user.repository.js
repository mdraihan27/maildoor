import User from './user.model.js';

/**
 * Repository layer – all direct DB interactions for User.
 * Controllers/services never call Mongoose directly.
 */
class UserRepository {
  async findById(id, projection) {
    return User.findById(id, projection).lean();
  }

  /**
   * Find by ID and include select:false fields.
   * Used when refresh-token or loginHistory data is needed.
   */
  async findByIdWithSecrets(id) {
    return User.findById(id)
      .select('+encryptedRefreshToken +refreshTokenExpiry +loginHistory')
      .lean();
  }

  async findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async findByGoogleId(googleId) {
    return User.findOne({ googleId }).lean();
  }

  /**
   * Find by Google ID and return a full Mongoose document (not lean).
   * Needed when instance methods (setRefreshToken, recordLogin) are required.
   */
  async findDocumentByGoogleId(googleId) {
    return User.findOne({ googleId })
      .select('+encryptedRefreshToken +refreshTokenExpiry +loginHistory');
  }

  async create(data) {
    const user = await User.create(data);
    return user.toJSON();
  }

  async updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  }

  async suspend(id) {
    return this.updateById(id, { status: User.STATUSES?.SUSPENDED || 'SUSPENDED' });
  }

  async reactivate(id) {
    return this.updateById(id, { status: User.STATUSES?.ACTIVE || 'ACTIVE' });
  }

  async list({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } }) {
    const [docs, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return { docs, total };
  }

  async pushApiKey(userId, apiKeyId) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { apiKeys: apiKeyId } },
      { new: true },
    ).lean();
  }

  async pullApiKey(userId, apiKeyId) {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { apiKeys: apiKeyId } },
      { new: true },
    ).lean();
  }
}

export default new UserRepository();
