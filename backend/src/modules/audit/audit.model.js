import mongoose from 'mongoose';

// ─── Constants ──────────────────────────────────────────────────

/**
 * Canonical action identifiers.
 * Every audit entry MUST use one of these — no ad-hoc strings.
 */
const ACTIONS = Object.freeze({
  // Auth
  AUTH_GOOGLE_LOGIN: 'AUTH_GOOGLE_LOGIN',
  AUTH_TOKEN_REFRESH: 'AUTH_TOKEN_REFRESH',
  AUTH_LOGOUT: 'AUTH_LOGOUT',

  // API keys
  APIKEY_CREATED: 'APIKEY_CREATED',
  APIKEY_USED: 'APIKEY_USED',
  APIKEY_REVOKED: 'APIKEY_REVOKED',
  APIKEY_DELETED: 'APIKEY_DELETED',

  // Email
  EMAIL_SEND_ATTEMPT: 'EMAIL_SEND_ATTEMPT',
  EMAIL_SEND_SUCCESS: 'EMAIL_SEND_SUCCESS',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',

  // User management
  USER_UPDATED: 'USER_UPDATED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
});

const CATEGORIES = Object.freeze({
  AUTH: 'AUTH',
  APIKEY: 'APIKEY',
  EMAIL: 'EMAIL',
  USER: 'USER',
});

const SEVERITIES = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
});

/**
 * Map action → category automatically.
 * @param {string} action
 * @returns {string}
 */
const deriveCategory = (action) => {
  if (action.startsWith('AUTH_')) return CATEGORIES.AUTH;
  if (action.startsWith('APIKEY_')) return CATEGORIES.APIKEY;
  if (action.startsWith('EMAIL_')) return CATEGORIES.EMAIL;
  if (action.startsWith('USER_')) return CATEGORIES.USER;
  return 'OTHER';
};

// ─── Schema ─────────────────────────────────────────────────────

const auditLogSchema = new mongoose.Schema(
  {
    /** User who performed the action (null for system-level events). */
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    /** Canonical action identifier (see ACTIONS enum). */
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: {
        values: Object.values(ACTIONS),
        message: 'Action `{VALUE}` is not a recognised audit event',
      },
      index: true,
    },

    /** Auto-derived category for filtering/dashboard grouping. */
    category: {
      type: String,
      enum: [...Object.values(CATEGORIES), 'OTHER'],
      index: true,
    },

    /** Severity level for alerting / priority filtering. */
    severity: {
      type: String,
      enum: Object.values(SEVERITIES),
      default: SEVERITIES.INFO,
    },

    /** Resource type acted upon (e.g. 'User', 'ApiKey', 'EmailLog'). */
    resource: {
      type: String,
      default: null,
    },

    /** ID of the specific resource instance. */
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Request context ───────────────────────────────────────

    ip: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    deviceInfo: {
      type: String,
      default: null,
      maxlength: 500,
    },

    /**
     * Subset of request headers relevant for forensics.
     * Stored as a flat key-value map; never includes Authorization or Cookie.
     */
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /** X-Request-Id correlation ID (from requestId middleware). */
    requestId: {
      type: String,
      default: null,
    },

    // ── Optional context ──────────────────────────────────────

    /** Free-form metadata specific to the action. */
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /** Duration of the operation in milliseconds (email sends, etc.). */
    durationMs: {
      type: Number,
      default: null,
    },

    /** Whether the action succeeded or failed. */
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', null],
      default: null,
    },

    /** Error message when outcome is FAILURE. */
    errorMessage: {
      type: String,
      default: null,
      maxlength: 2000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable log entries
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  },
);

// ─── Pre-save: auto-derive category ────────────────────────────
auditLogSchema.pre('save', function (next) {
  if (!this.category && this.action) {
    this.category = deriveCategory(this.action);
  }
  next();
});

// ─── Indexes ────────────────────────────────────────────────────

/** TTL — auto-delete entries older than 90 days. */
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/** Actor timeline queries. */
auditLogSchema.index({ actor: 1, createdAt: -1 });

/** Category + date for dashboards. */
auditLogSchema.index({ category: 1, createdAt: -1 });

/** Action + outcome for targeted lookups. */
auditLogSchema.index({ action: 1, outcome: 1, createdAt: -1 });

/** IP-based forensics. */
auditLogSchema.index({ ip: 1, createdAt: -1 }, { sparse: true });

/** Request correlation. */
auditLogSchema.index({ requestId: 1 }, { sparse: true });

// ─── Statics ────────────────────────────────────────────────────
auditLogSchema.statics.ACTIONS = ACTIONS;
auditLogSchema.statics.CATEGORIES = CATEGORIES;
auditLogSchema.statics.SEVERITIES = SEVERITIES;

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
