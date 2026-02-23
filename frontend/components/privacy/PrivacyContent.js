/**
 * PrivacyContent — Full privacy policy text content.
 * Industry-grade privacy policy for MailDoor.
 */

const sections = [
  {
    title: "1. Introduction",
    content: `MailDoor ("we", "us", "our") is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal data when you use our email relay service ("the Service"). We adhere to industry best practices and international data protection standards. By using the Service, you consent to the practices described in this policy.`,
  },
  {
    title: "2. Data We Collect",
    content: `We collect only the minimum data necessary to operate the Service:\n\n(a) Account Data: Your name, email address, and profile picture, obtained via Google OAuth 2.0 during authentication.\n(b) Authentication Credentials: Google OAuth refresh tokens, used solely to send emails on your behalf via the Gmail API. These are encrypted at rest.\n(c) API Key Metadata: Key names, creation dates, usage timestamps, and status. Raw API keys are never stored; only irreversible SHA-256 hashes are retained.\n(d) Activity Logs: Records of actions performed through the Service, including API calls, email events, authentication events, and administrative actions. Logs include timestamps, IP addresses, and user agent strings.\n(e) Device & Session Data: IP address, user agent, browser type, operating system, and device information collected at login for security purposes.`,
  },
  {
    title: "3. How We Use Your Data",
    content: `Your data is used exclusively for:\n\n(a) Providing the Service: Authenticating your identity, sending emails via the Gmail API on your behalf, and managing your API keys.\n(b) Security & Fraud Prevention: Detecting unauthorized access, preventing abuse, enforcing rate limits, and maintaining activity logs.\n(c) Service Improvement: Aggregated, anonymized usage metrics to improve reliability and performance.\n\nWe do NOT use your data for advertising, profiling, marketing, analytics beyond basic operational metrics, or any purpose unrelated to delivering the Service.`,
  },
  {
    title: "4. Data Encryption & Security",
    content: `We implement enterprise-grade security measures to protect your data:\n\n(a) Encryption at Rest: All Google OAuth refresh tokens are encrypted using AES-256-GCM, an authenticated encryption standard used by financial institutions and government agencies. Each token is encrypted with a unique initialization vector (IV) and authenticated with an authentication tag to prevent tampering.\n(b) Encryption in Transit: All communications between your browser, our servers, and third-party APIs are encrypted using TLS 1.2+ (HTTPS enforced).\n(c) API Key Security: API keys are hashed using SHA-256 before storage. We use constant-time comparison algorithms to prevent timing-based side-channel attacks. Raw keys are displayed exactly once at creation and are irrecoverable.\n(d) HTTP Security Headers: We enforce Content-Security-Policy, Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, and Referrer-Policy headers.\n(e) Input Sanitization: All user inputs are sanitized against NoSQL injection, XSS, and other common attack vectors.\n(f) Request Size Limits: Request bodies are limited to 256KB to prevent denial-of-service attacks.\n(g) Request Tracing: Every request is assigned a unique UUID (X-Request-Id) for log traceability.`,
  },
  {
    title: "5. Data Retention",
    content: `We retain your data only as long as necessary:\n\n(a) Account Data: Retained for the lifetime of your account. Upon account deletion, your data is permanently removed.\n(b) Activity Logs: Automatically deleted after 90 days via a TTL (Time-To-Live) index. This is enforced at the database level and cannot be overridden.\n(c) API Key Hashes: Retained until the key is revoked or the account is deleted.\n(d) Session Data: Login metadata is retained within activity logs and subject to the same 90-day TTL.\n\nWe do not retain email content beyond the encrypted log entry created at the time of sending.`,
  },
  {
    title: "6. Third-Party Services",
    content: `The Service integrates with the following third-party providers:\n\n(a) Google APIs (OAuth 2.0 & Gmail API): Used for authentication and sending emails on your behalf. Google's privacy policy governs their handling of your data. We request only the minimum scopes required: profile information and Gmail send capability.\n(b) MongoDB Atlas: Our database provider. Data is stored in encrypted, access-controlled clusters.\n\nWe do NOT integrate with any advertising networks, analytics platforms (such as Google Analytics), social media trackers, or data brokers. No third-party scripts, pixels, or tracking technologies are embedded in the Service.`,
  },
  {
    title: "7. Data Sharing",
    content: `We do NOT sell, rent, trade, license, or share your personal data with any third party for any purpose, except:\n\n(a) Legal Obligation: If required by law, regulation, legal process, or enforceable governmental request.\n(b) Protection of Rights: To enforce our Terms & Conditions, protect the security of the Service, or protect the rights, property, or safety of MailDoor, our users, or the public.\n\nIn such cases, we will disclose only the minimum data necessary and, where legally permitted, notify affected users.`,
  },
  {
    title: "8. Access Control & Authorization",
    content: `The Service implements role-based access control (RBAC) with three tiers:\n\n(a) User: Standard access to own account, API keys, and activity logs.\n(b) Admin: Can view and manage other users within their scope.\n(c) Super Admin: Full system access.\n\nAll authenticated requests are verified using short-lived JWT access tokens (15-minute expiry) and long-lived refresh tokens (7-day expiry, HTTP-only, secure, SameSite cookies). Session tokens cannot be accessed by client-side JavaScript.`,
  },
  {
    title: "9. CSRF & Session Protection",
    content: `We implement the following session security measures:\n\n(a) OAuth State Parameter: A cryptographically random state value is generated and stored in a secure, HTTP-only, SameSite cookie during the OAuth flow to prevent cross-site request forgery.\n(b) Secure Cookies: All authentication cookies are set with Secure, HttpOnly, and SameSite=Lax flags.\n(c) Token Rotation: Refresh tokens are rotated upon use. If a token is reused (indicating potential theft), the session is invalidated.\n(d) Rate Limiting: Authentication endpoints are rate-limited to 20 requests per 15 minutes to prevent brute-force attacks.`,
  },
  {
    title: "10. Your Rights",
    content: `You have the following rights regarding your data:\n\n(a) Access: You can view your profile data and activity logs through the dashboard at any time.\n(b) Rectification: Profile data is sourced from your Google account. Update it there to reflect changes in the Service.\n(c) Deletion: You may request complete deletion of your account and all associated data. API keys, activity logs, and credentials will be permanently removed.\n(d) Portability: You can export your activity logs from the dashboard.\n(e) Restriction: You can revoke MailDoor's access at any time through your Google Account permissions (myaccount.google.com/permissions).\n\nTo exercise any of these rights, contact us through the Service or revoke access via your Google account settings.`,
  },
  {
    title: "11. Children's Privacy",
    content: `The Service is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete that data immediately.`,
  },
  {
    title: "12. Breach Notification",
    content: `In the unlikely event of a data breach that affects your personal data, we will:\n\n(a) Investigate and contain the breach promptly.\n(b) Notify affected users within 72 hours of becoming aware of the breach.\n(c) Provide details of the breach, the data affected, and the measures taken.\n(d) Report the breach to relevant authorities as required by law.\n\nOur encryption-at-rest measures ensure that even in the event of unauthorized database access, credential data remains protected by AES-256-GCM encryption.`,
  },
  {
    title: "13. Cookies",
    content: `The Service uses only essential, functional cookies required for authentication and security. We use:\n\n(a) OAuth State Cookie: A temporary, secure, HTTP-only cookie used during the Google OAuth flow. Deleted after authentication completes.\n(b) Refresh Token Cookie: A secure, HTTP-only, SameSite cookie that maintains your session. Expires after 7 days of inactivity.\n\nWe do NOT use tracking cookies, advertising cookies, analytics cookies, or any non-essential cookies. No cookie consent banner is required because we use only strictly necessary cookies.`,
  },
  {
    title: "14. International Data",
    content: `If you access the Service from outside the jurisdiction where our servers are located, your data may be transferred across international borders. By using the Service, you consent to this transfer. We ensure that all data transfers are protected by the encryption and security measures described in this policy.`,
  },
  {
    title: "15. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated revision date. Continued use of the Service after changes constitutes acceptance. We encourage you to review this policy periodically.`,
  },
];

export default function PrivacyContent() {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-semibold mb-3 text-foreground">
            {section.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </section>
      ))}

      {/* Closing note */}
      <div className="mt-12 pt-8 border-t border-[#70012b]/10">
        <p className="text-xs text-muted/60 text-center">
          Your privacy matters to us. MailDoor is designed with security and
          data protection at its core.
        </p>
      </div>
    </div>
  );
}
