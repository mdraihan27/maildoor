import mongoose from 'mongoose';

// ─── Constants ──────────────────────────────────────────────────
const STATUSES = Object.freeze({ ACTIVE: 'ACTIVE', REVOKED: 'REVOKED' });

const MAX_KEYS_PER_USER = 25;

// ─── Schema ─────────────────────────────────────────────────────
const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Key name is required'],
      trim: true,
      maxlength: [80, 'Key name cannot exceed 80 characters'],
    },

    /**
     * SHA-256 hex digest of the raw key.
     * The plaintext key is NEVER persisted — shown once at creation.
     */
    hashedKey: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * First 8 characters of the raw key (e.g. "mk_live_a1").
     * Stored for display so users can identify keys without exposing them.
     */
    prefix: {
      type: String,
      required: true,
      maxlength: 12,
    },

    /**
     * Last 4 characters of the raw key.
     * Combined with prefix gives users enough to identify a key.
     */
    suffix: {
      type: String,
      required: true,
      maxlength: 4,
    },

    status: {
      type: String,
      enum: {
        values: Object.values(STATUSES),
        message: 'Status `{VALUE}` is not supported',
      },
      default: STATUSES.ACTIVE,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    /** Optional IP allowlist — empty means any IP. */
    allowedIPs: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.hashedKey; // never leak the hash
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

// ─── Indexes ────────────────────────────────────────────────────
apiKeySchema.index({ hashedKey: 1 }, { unique: true });
apiKeySchema.index({ user: 1, status: 1 });
apiKeySchema.index({ expiresAt: 1 }, { sparse: true });

// ─── Virtuals ───────────────────────────────────────────────────
apiKeySchema.virtual('maskedKey').get(function () {
  return `${this.prefix}${'•'.repeat(8)}${this.suffix}`;
});

apiKeySchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// ─── Statics ────────────────────────────────────────────────────
apiKeySchema.statics.STATUSES = STATUSES;
apiKeySchema.statics.MAX_KEYS_PER_USER = MAX_KEYS_PER_USER;

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

export default ApiKey;
