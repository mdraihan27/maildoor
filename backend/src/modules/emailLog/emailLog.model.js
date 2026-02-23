import mongoose from 'mongoose';
import { encrypt, decrypt, isEncrypted } from '../../utils/encryption.js';

// ─── Constants ──────────────────────────────────────────────────
const STATUSES = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
});

const getSecret = () => process.env.JWT_SECRET;

// ─── Schema ─────────────────────────────────────────────────────
const emailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      default: null,
    },

    // ── Sender ──────────────────────────────────────────────────
    fromEmail: {
      type: String,
      required: [true, 'Sender email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid sender email format'],
    },

    fromName: {
      type: String,
      trim: true,
      maxlength: [120, 'Sender name cannot exceed 120 characters'],
      default: null,
    },

    // ── Recipient ───────────────────────────────────────────────
    toEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid recipient email format'],
    },

    // ── Content ─────────────────────────────────────────────────
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [998, 'Subject cannot exceed 998 characters'], // RFC 2822 line limit
    },

    /**
     * Email body — AES-256-GCM encrypted at rest.
     * Stored as `iv:authTag:ciphertext` hex format via pre-save hook.
     * Decrypted on-demand via the `decryptBody()` instance method.
     *
     * Optional: not every log needs to retain the full body.
     */
    body: {
      type: String,
      default: null,
      select: false, // excluded from default queries for performance
    },

    // ── Status / scheduling ─────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: Object.values(STATUSES),
        message: 'Status `{VALUE}` is not supported',
      },
      default: STATUSES.PENDING,
      index: true,
    },

    scheduledAt: {
      type: Date,
      default: null,
      // index defined explicitly below (with sparse option)
    },

    sentAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
      maxlength: [2000, 'Failure reason cannot exceed 2000 characters'],
    },

    // ── Request context ─────────────────────────────────────────
    requestIP: {
      type: String,
      default: null,
    },

    deviceInfo: {
      type: String,
      default: null,
      maxlength: [500, 'Device info cannot exceed 500 characters'],
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: [1000, 'User agent cannot exceed 1000 characters'],
    },

    // ── Provider reference ──────────────────────────────────────
    /**
     * SMTP message ID returned after successful send.
     * Enables future retrieval, threading, or status tracking.
     */
    messageId: {
      type: String,
      default: null,
      // index defined explicitly below (unique + sparse)
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.body; // never leak encrypted body in serialised output
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

// ─── Indexes ────────────────────────────────────────────────────
emailLogSchema.index({ userId: 1, status: 1 });
emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ scheduledAt: 1 }, { sparse: true });
emailLogSchema.index({ messageId: 1 }, { unique: true, sparse: true });
emailLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }, // 90-day TTL
);

// ─── Pre-save: encrypt body ────────────────────────────────────
// Mongoose 9 no longer passes `next` — use async/throw instead
emailLogSchema.pre('save', function () {
  if (!this.isModified('body') || !this.body) return;

  if (!isEncrypted(this.body)) {
    this.body = encrypt(this.body, getSecret());
  }
});

// ─── Instance methods ───────────────────────────────────────────

/**
 * Decrypt and return the email body.
 * Must be called on a document fetched with `.select('+body')`.
 */
emailLogSchema.methods.decryptBody = function () {
  if (!this.body) return null;
  return decrypt(this.body, getSecret());
};

/**
 * Mark the log as SENT with a timestamp and optional message ID.
 */
emailLogSchema.methods.markSent = function (messageId = null) {
  this.status = STATUSES.SENT;
  this.sentAt = new Date();
  if (messageId) this.messageId = messageId;
  return this.save();
};

/**
 * Mark the log as FAILED with a reason string.
 */
emailLogSchema.methods.markFailed = function (reason) {
  this.status = STATUSES.FAILED;
  this.failureReason = (reason || 'Unknown error').substring(0, 2000);
  return this.save();
};

// ─── Statics ────────────────────────────────────────────────────
emailLogSchema.statics.STATUSES = STATUSES;

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
