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

    // ── Encrypted Gmail app password ──────────────────────────────
    encryptedAppPassword: {
      type: String,
      default: null,
      select: false, // never returned by default queries
    },

    /** Whether the user has configured an app password. */
    hasAppPassword: {
      type: Boolean,
      default: false,
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
        delete ret.encryptedAppPassword;
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
userSchema.index({ hasAppPassword: 1 });

// ─── Pre-save hook: encrypt app password ────────────────────────
userSchema.pre('save', function (next) {
  if (!this.isModified('encryptedAppPassword')) return next();

  // If the field is being cleared, allow null through
  if (this.encryptedAppPassword === null) {
    this.hasAppPassword = false;
    return next();
  }

  try {
    // Only encrypt if the value is plaintext (not already encrypted)
    if (!isEncrypted(this.encryptedAppPassword)) {
      this.encryptedAppPassword = encrypt(this.encryptedAppPassword, getSecret());
    }
    this.hasAppPassword = true;
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance methods ───────────────────────────────────────────

/**
 * Decrypt and return the stored app password.
 * Returns null when no password exists or decryption fails.
 */
userSchema.methods.getDecryptedAppPassword = function () {
  if (!this.encryptedAppPassword) return null;
  try {
    return decrypt(this.encryptedAppPassword, getSecret());
  } catch {
    return null;
  }
};

/**
 * Set (and encrypt) a new app password.
 * Call `.save()` after this method.
 */
userSchema.methods.setAppPassword = function (plainPassword) {
  this.encryptedAppPassword = plainPassword;
  // hasAppPassword is set in pre-save hook
};

/** Clear stored app password. */
userSchema.methods.clearAppPassword = function () {
  this.encryptedAppPassword = null;
  this.hasAppPassword = false;
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
