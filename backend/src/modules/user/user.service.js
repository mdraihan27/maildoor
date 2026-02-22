import UserRepository from './user.repository.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { stripUndefined } from '../../utils/helpers.js';

class UserService {
  async getById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async getByEmail(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(id, { name, profilePicture }) {
    const payload = stripUndefined({ name, profilePicture });
    const user = await UserRepository.updateById(id, payload);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async changeRole(id, role) {
    const user = await UserRepository.updateById(id, { role });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async suspend(id) {
    const user = await UserRepository.suspend(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async reactivate(id) {
    const user = await UserRepository.reactivate(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async list(filter, pagination) {
    return UserRepository.list({ filter, ...pagination });
  }

  /**
   * Find-or-create user from normalised Google profile.
   * Stores encrypted Google refresh token & records login metadata.
   *
   * @param {object} profile  Normalised profile from GoogleOAuthService
   *   { googleId, email, name, profilePicture }
   * @param {object} opts
   * @param {{ ip, userAgent, device }} opts.loginMeta
   * @param {string|null}               opts.encryptedRefreshToken  Already-encrypted Google RT
   */
  async findOrCreateFromGoogle(profile, { loginMeta = {}, encryptedRefreshToken = null } = {}) {
    const doc = await UserRepository.findDocumentByGoogleId(profile.googleId);

    if (doc) {
      // ── Update mutable fields ────────────────────────────────
      doc.name = profile.name;
      doc.profilePicture = profile.profilePicture || doc.profilePicture;

      // Store encrypted Google refresh token (pre-encrypted by auth.service)
      if (encryptedRefreshToken) {
        doc.encryptedRefreshToken = encryptedRefreshToken;
        doc.refreshTokenExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      }

      // Record login event
      doc.recordLogin({
        ipAddress: loginMeta.ip,
        deviceInfo: loginMeta.device,
        userAgent: loginMeta.userAgent,
      });

      await doc.save();
      return doc.toJSON();
    }

    // ── New user ─────────────────────────────────────────────────
    const byEmail = await UserRepository.findByEmail(profile.email);
    if (byEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    return UserRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      profilePicture: profile.profilePicture || null,
      encryptedRefreshToken: encryptedRefreshToken || null,
      refreshTokenExpiry: encryptedRefreshToken
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        : null,
      lastLoginIP: loginMeta.ip || null,
      lastLoginDevice: loginMeta.device || null,
      loginHistory: loginMeta.ip
        ? [{ ipAddress: loginMeta.ip, deviceInfo: loginMeta.device, userAgent: loginMeta.userAgent }]
        : [],
    });
  }

  /**
   * Clear refresh token for a user (logout flow).
   * @param {string} userId
   */
  async clearRefreshToken(userId) {
    const doc = await UserRepository.findDocumentByGoogleId(null)
      || await UserRepository.findById(userId);

    // Use direct update to avoid needing the document instance
    await UserRepository.updateById(userId, {
      encryptedRefreshToken: null,
      refreshTokenExpiry: null,
    });
  }
}

export default new UserService();
