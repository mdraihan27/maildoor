import UserRepository from './user.repository.js';
import User from './user.model.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
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
   */
  async findOrCreateFromGoogle(profile, { loginMeta = {} } = {}) {
    const doc = await UserRepository.findDocumentByGoogleId(profile.googleId);

    if (doc) {
      // ── Update mutable fields ────────────────────────────────
      doc.name = profile.name;
      doc.profilePicture = profile.profilePicture || doc.profilePicture;

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
      lastLoginIP: loginMeta.ip || null,
      lastLoginDevice: loginMeta.device || null,
      loginHistory: loginMeta.ip
        ? [{ ipAddress: loginMeta.ip, deviceInfo: loginMeta.device, userAgent: loginMeta.userAgent }]
        : [],
    });
  }

  // ─── App Password Management ─────────────────────────────────

  /**
   * Save a Gmail App Password for the user (encrypted at rest).
   * @param {string} userId
   * @param {string} appPassword  Plaintext 16-char Google App Password
   */
  async setAppPassword(userId, appPassword) {
    // Basic format validation: Google app passwords are 16 chars (no spaces)
    const cleaned = appPassword.replace(/\s/g, '');
    if (cleaned.length !== 16) {
      throw new BadRequestError(
        'Invalid App Password format. Google App Passwords are 16 characters (letters only, no spaces).',
      );
    }

    const doc = await User.findById(userId)
      .select('+encryptedAppPassword');
    if (!doc) throw new NotFoundError('User');

    doc.setAppPassword(cleaned);
    await doc.save();

    return { hasAppPassword: true };
  }

  /**
   * Remove the stored App Password for a user.
   * @param {string} userId
   */
  async removeAppPassword(userId) {
    const doc = await User.findById(userId)
      .select('+encryptedAppPassword');
    if (!doc) throw new NotFoundError('User');

    doc.clearAppPassword();
    await doc.save();

    return { hasAppPassword: false };
  }

  /**
   * Check whether user has an app password configured.
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async hasAppPassword(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return !!user.hasAppPassword;
  }
}

export default new UserService();
