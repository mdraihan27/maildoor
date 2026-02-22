/**
 * TermsContent — Full terms and conditions text content.
 * Separated from the page for clean component structure.
 */

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using MailDoor ("the Service"), you agree to be bound by these Terms and Conditions in full. If you do not agree, you must not use the Service. These terms are binding and enforceable upon all users.`,
  },
  {
    title: "2. Description of Service",
    content: `MailDoor is an email relay service. It allows users to connect their Gmail account and send emails through our API using the Gmail API on the user's behalf. The Service exists to provide a workaround for environments where outbound SMTP is blocked (such as DigitalOcean droplets). MailDoor does not host, create, or control the content of any emails sent through it.`,
  },
  {
    title: "3. User Responsibility",
    content: `YOU ARE SOLELY AND ENTIRELY RESPONSIBLE FOR:\n\n(a) All content, text, attachments, and subject matter of every email sent through the Service.\n(b) Every recipient to whom you send emails using the Service.\n(c) Ensuring that your use of the Service complies with all applicable local, national, and international laws and regulations.\n(d) Any consequences, legal or otherwise, arising from emails sent through the Service.\n(e) The security of your account credentials and API keys.\n\nMailDoor and its creators, developers, maintainers, and affiliates accept NO RESPONSIBILITY WHATSOEVER for the content, nature, destination, or consequences of any emails sent through the Service. We do not monitor, review, filter, or approve outgoing emails. You use the Service entirely at your own risk.`,
  },
  {
    title: "4. No Liability for Email Content",
    content: `MailDoor acts exclusively as a technical relay. We do not read, store (beyond encrypted audit logs), endorse, or verify the content of any email sent through the Service. The user who initiates an email is the sole author and sender. Any claims, disputes, legal actions, or damages arising from emails sent through the Service are the exclusive responsibility of the user who sent them. MailDoor and its creators shall not be named as a party in, or held liable for, any such matter.`,
  },
  {
    title: "5. Account Registration",
    content: `You must authenticate via Google OAuth 2.0. By signing in, you authorize MailDoor to access your Google profile information and Gmail sending capabilities. You are responsible for all activity under your account and API keys. Notify us immediately of any unauthorized access.`,
  },
  {
    title: "6. API Keys",
    content: `API keys grant programmatic access to send emails through the Service. You are responsible for all activity performed using your keys. Keys are displayed once at creation and stored as irreversible hashes. Lost keys cannot be recovered. Do not share your keys. The Service allows a maximum of 25 active keys per account.`,
  },
  {
    title: "7. Prohibited Use",
    content: `You must not use the Service to: (a) send spam or unsolicited bulk email; (b) send illegal, threatening, abusive, harassing, defamatory, or fraudulent content; (c) impersonate any person or entity; (d) distribute malware, phishing attempts, or harmful code; (e) interfere with or attempt to compromise the Service; (f) circumvent rate limits or security measures; (g) violate any applicable laws. Violation of these terms may result in immediate and permanent account suspension without notice.`,
  },
  {
    title: "8. Rate Limiting",
    content: `The Service enforces rate limits: 100 requests per 15 minutes per IP globally, 20 requests per 15 minutes for authentication, and 200 requests per 15 minutes per API key. Exceeding limits results in temporary throttling. Persistent abuse leads to suspension.`,
  },
  {
    title: "9. Data Handling",
    content: `Google credentials are encrypted at rest using AES-256-GCM. Audit logs are retained for 90 days and automatically deleted. We do not sell or share your data with third parties. Login metadata (IP, user agent, device) is collected for security purposes.`,
  },
  {
    title: "10. Disclaimer of Warranties",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOU USE THE SERVICE AT YOUR SOLE RISK.`,
  },
  {
    title: "11. Limitation of Liability",
    content: `IN NO EVENT SHALL MAILDOOR, ITS CREATORS, DEVELOPERS, CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PROFITS, REPUTATION, OR ANY DAMAGES RESULTING FROM EMAILS SENT THROUGH THE SERVICE. THIS LIMITATION APPLIES REGARDLESS OF THE LEGAL THEORY UNDER WHICH DAMAGES ARE SOUGHT.`,
  },
  {
    title: "12. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless MailDoor and its creators from any and all claims, liabilities, damages, losses, and expenses (including legal fees) arising from your use of the Service, the content of emails you send, or your violation of these terms.`,
  },
  {
    title: "13. Account Suspension",
    content: `We reserve the right to suspend or terminate any account at any time, for any reason, without prior notice. Suspended accounts lose all access to the Service. Reactivation is at our sole discretion.`,
  },
  {
    title: "14. Changes to Terms",
    content: `We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance. It is your responsibility to review these terms periodically.`,
  },
  {
    title: "15. Governing Law",
    content: `These terms are governed by applicable law. Any disputes shall be subject to the exclusive jurisdiction of the appropriate courts. If any provision is found unenforceable, the remaining provisions remain in full effect.`,
  },
];

export default function TermsContent() {
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

      {/* Acceptance note */}
      <div className="mt-12 pt-8 border-t border-[#70012b]/10">
        <p className="text-xs text-muted/60 text-center">
          By using MailDoor, you acknowledge that you have read, understood, and
          agree to be bound by these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}
