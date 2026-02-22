import mongoose from 'mongoose';
import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js';

// ─── Constants ──────────────────────────────────────────────────
const ROLES = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN', SUPERADMIN: 'SUPERADMIN' });
const STATUSES = Object.freeze({ ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' });

const getSecret = () => process.env.JWT_SECRET;

// ─── Sub-schemas ────────────────────────────────────────────────
const loginHistorySchema = new mongoose.Schema(
  {
    ipAddress: { type: String, default: null },
    deviceInfo: { type: String, default: null },
    userAgent: { type: String, default: null },
    loginAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ─── Main schema ────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, 'Google ID is required'],
      unique: true,
      immutable: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },

    profilePicture: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: 'Role `{VALUE}` is not supported' },
      default: ROLES.USER,
    },

    status: {
      type: String,
      enum: { values: Object.values(STATUSES), message: 'Status `{VALUE}` is not supported' },
      default: STATUSES.ACTIVE,
    },

    // ── Encrypted refresh token ──────────────────────────────────
    encryptedRefreshToken: {
      type: String,
      default: null,
      select: false, // never returned by default queries
    },

    refreshTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },

    // ── API key references ───────────────────────────────────────
    apiKeys: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ApiKey',
      },
    ],

    // ── Login tracking ───────────────────────────────────────────
    lastLoginIP: {
      type: String,
      default: null,
    },

    lastLoginDevice: {
      type: String,
      default: null,
    },

    loginHistory: {
      type: [loginHistorySchema],
      default: [],
      select: false, // excluded from default queries for performance
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.encryptedRefreshToken;
        delete ret.refreshTokenExpiry;
        delete ret.loginHistory;
        ret.id = ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ────────────────────────────────────────────────────
userSchema.index({ googleId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ 'loginHistory.loginAt': -1 });
userSchema.index({ refreshTokenExpiry: 1 }, { sparse: true });

// ─── Pre-save hook: encrypt refresh token ───────────────────────
userSchema.pre('save', function (next) {
  if (!this.isModified('encryptedRefreshToken')) return next();

  // If the field is being cleared, allow null through
  if (this.encryptedRefreshToken === null) return next();

  try {
    // Only encrypt if the value is plaintext (not already encrypted)
    if (!isEncrypted(this.encryptedRefreshToken)) {
      this.encryptedRefreshToken = encrypt(this.encryptedRefreshToken, getSecret());
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance methods ───────────────────────────────────────────

/**
 * Decrypt and return the stored refresh token.
 * Returns null when no token exists or decryption fails.
 */
userSchema.methods.getDecryptedRefreshToken = function () {
  if (!this.encryptedRefreshToken) return null;
  try {
    return decrypt(this.encryptedRefreshToken, getSecret());
  } catch {
    return null;
  }
};

/**
 * Set (and encrypt) a new refresh token + expiry.
 * Call `.save()` after this method.
 */
userSchema.methods.setRefreshToken = function (plainToken, expiresIn = 7 * 24 * 60 * 60 * 1000) {
  this.encryptedRefreshToken = plainToken;
  this.refreshTokenExpiry = new Date(Date.now() + expiresIn);
};

/** Clear stored refresh token (logout / rotation). */
userSchema.methods.clearRefreshToken = function () {
  this.encryptedRefreshToken = null;
  this.refreshTokenExpiry = null;
};

/** Check whether the stored refresh token has expired. */
userSchema.methods.isRefreshTokenExpired = function () {
  if (!this.refreshTokenExpiry) return true;
  return this.refreshTokenExpiry < new Date();
};

/**
 * Append a login event and cap the history at the most recent N entries.
 * @param {{ ipAddress, deviceInfo, userAgent }} entry
 * @param {number} maxEntries  Maximum history entries to retain
 */
userSchema.methods.recordLogin = function (entry, maxEntries = 20) {
  this.lastLoginIP = entry.ipAddress || null;
  this.lastLoginDevice = entry.deviceInfo || null;

  this.loginHistory.push({
    ipAddress: entry.ipAddress,
    deviceInfo: entry.deviceInfo,
    userAgent: entry.userAgent,
    loginAt: new Date(),
  });

  // Keep only the most recent entries
  if (this.loginHistory.length > maxEntries) {
    this.loginHistory = this.loginHistory.slice(-maxEntries);
  }
};

// ─── Static helpers ─────────────────────────────────────────────
userSchema.statics.ROLES = ROLES;
userSchema.statics.STATUSES = STATUSES;

const User = mongoose.model('User', userSchema);

export default User;
