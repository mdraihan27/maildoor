/**
 * Docs Page — API documentation with curl examples.
 */
"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Mail,
  Key,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";

export default function DocsPage() {
  return (
    <PageShell
      title="API Documentation"
      description="Learn how to send emails through MailDoor using simple HTTP requests."
    >
      <div className="mx-auto max-w-3xl space-y-10 pb-20">
        {/* Quick Start */}
        <Section icon={BookOpen} title="Quick Start">
          <p className="text-sm text-muted leading-relaxed mb-4">
            MailDoor lets you send emails from your Gmail account via a simple
            REST API. You authenticate with an API key, and emails are delivered
            through Gmail SMTP using your App Password.
          </p>
          <ol className="list-decimal list-inside text-sm text-muted space-y-2 leading-relaxed">
            <li>Sign in with Google and set up your Gmail App Password on the API Keys page.</li>
            <li>Create an API key from the dashboard.</li>
            <li>Use the API key in the <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">x-api-key</code> header of your requests.</li>
          </ol>
        </Section>

        {/* Base URL */}
        <Section icon={Key} title="Authentication">
          <p className="text-sm text-muted leading-relaxed mb-4">
            All API requests require an API key passed in the <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">x-api-key</code> header.
            API keys can be created and managed from the{" "}
            <a href="/dashboard/api-keys" className="text-[#70012b] hover:text-[#e0a0b8] transition-colors">
              API Keys
            </a>{" "}
            page.
          </p>
          <CodeBlock
            title="Header format"
            code={`x-api-key: your_api_key_here`}
            language="http"
          />
          <p className="text-xs text-muted mt-3">
            API keys are hashed (SHA-256) before storage. You will only see the full key once — when you create it.
          </p>
        </Section>

        {/* Send Email */}
        <Section icon={Mail} title="Send Email">
          <EndpointBadge method="POST" path="/api/email/send" />

          <p className="text-sm text-muted leading-relaxed my-4">
            Send an email from your Gmail account. Requires a valid App Password to be configured.
          </p>

          {/* Request body */}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted/70 mb-3">
            Request Body (JSON)
          </h4>
          <div className="overflow-x-auto mb-6 rounded-lg border border-[#70012b]/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#70012b]/10 bg-[#130007]/30">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted">Field</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted">Required</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted">Description</th>
                </tr>
              </thead>
              <tbody className="text-xs text-muted">
                <tr className="border-b border-[#70012b]/5">
                  <td className="px-4 py-2 font-mono">to</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2">Recipient email address</td>
                </tr>
                <tr className="border-b border-[#70012b]/5">
                  <td className="px-4 py-2 font-mono">subject</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2">Email subject (1–998 chars)</td>
                </tr>
                <tr className="border-b border-[#70012b]/5">
                  <td className="px-4 py-2 font-mono">body</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2">Email body text or HTML (max 50,000 chars)</td>
                </tr>
                <tr className="border-b border-[#70012b]/5">
                  <td className="px-4 py-2 font-mono">fromName</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2">Display name for the sender (max 120 chars)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono">contentType</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2">&quot;text&quot; (default) or &quot;html&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Example: plain text */}
          <CollapsibleExample title="Send a plain text email" defaultOpen>
            <CodeBlock
              title="Request"
              language="bash"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/email/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your_api_key_here" \\
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from MailDoor",
    "body": "This is a test email sent via MailDoor API."
  }'`}
            />
            <CodeBlock
              title="Response (200)"
              language="json"
              code={`{
  "status": "success",
  "message": "Email sent successfully",
  "data": {
    "messageId": "<abc123@smtp.gmail.com>",
    "accepted": ["recipient@example.com"],
    "rejected": [],
    "from": "you@gmail.com",
    "to": "recipient@example.com",
    "subject": "Hello from MailDoor",
    "status": "SENT",
    "sentAt": "2025-01-15T12:00:00.000Z"
  }
}`}
            />
          </CollapsibleExample>

          {/* Example: HTML */}
          <CollapsibleExample title="Send an HTML email with a custom sender name">
            <CodeBlock
              title="Request"
              language="bash"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/email/send \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your_api_key_here" \\
  -d '{
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "<h1>Welcome aboard</h1><p>Thanks for joining us.</p>",
    "fromName": "My App",
    "contentType": "html"
  }'`}
            />
          </CollapsibleExample>
        </Section>

        {/* Rate Limiting */}
        <Section icon={AlertTriangle} title="Rate Limiting">
          <p className="text-sm text-muted leading-relaxed mb-4">
            Each API key is rate-limited to prevent abuse. When you exceed the limit, the API returns a <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">429</code> status code.
          </p>
          <CodeBlock
            title="Rate limit exceeded (429)"
            language="json"
            code={`{
  "status": "error",
  "message": "Rate limit exceeded for this API key. Try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}`}
          />
        </Section>

        {/* Error Responses */}
        <Section icon={AlertTriangle} title="Error Responses">
          <p className="text-sm text-muted leading-relaxed mb-4">
            All errors follow a consistent format. The <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">code</code> field helps you handle errors programmatically.
          </p>

          <div className="space-y-4">
            <ErrorExample
              status="400"
              title="Validation Error"
              code={`{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "to", "message": "A valid recipient email address is required" }
  ]
}`}
            />

            <ErrorExample
              status="401"
              title="Invalid or Missing API Key"
              code={`{
  "status": "error",
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}`}
            />

            <ErrorExample
              status="403"
              title="API Key Revoked"
              code={`{
  "status": "error",
  "message": "API key has been revoked",
  "code": "API_KEY_REVOKED"
}`}
            />

            <ErrorExample
              status="400"
              title="No App Password Configured"
              code={`{
  "status": "error",
  "message": "App password not configured. Please set your Gmail App Password first.",
  "code": "APP_PASSWORD_REQUIRED"
}`}
            />

            <ErrorExample
              status="401"
              title="Gmail Authentication Failed"
              code={`{
  "status": "error",
  "message": "Gmail authentication failed. Your App Password may be invalid or revoked.",
  "code": "GMAIL_AUTH_FAILED"
}`}
            />

            <ErrorExample
              status="422"
              title="Email Rejected by Gmail"
              code={`{
  "status": "error",
  "message": "Email rejected: recipient address does not exist or mailbox is full.",
  "code": "EMAIL_REJECTED"
}`}
            />

            <ErrorExample
              status="503"
              title="Gmail Temporarily Unavailable"
              code={`{
  "status": "error",
  "message": "Gmail is temporarily unavailable. Please try again in a few minutes.",
  "code": "GMAIL_UNAVAILABLE"
}`}
            />
          </div>
        </Section>
      </div>
    </PageShell>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function Section({ icon: Icon, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-[#70012b]" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EndpointBadge({ method, path }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-[#70012b]/10 bg-[#130007]/30 px-3 py-1.5">
      <span className="text-xs font-bold text-green-400">{method}</span>
      <span className="text-sm font-mono text-muted">{path}</span>
    </div>
  );
}

function CodeBlock({ title, code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#70012b]/10 overflow-hidden my-3">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#130007]/40 border-b border-[#70012b]/10">
          <span className="text-xs text-muted/70">{title}</span>
          <button
            onClick={handleCopy}
            className="text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Copy"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
      )}
      <pre className="px-4 py-3 bg-black/60 overflow-x-auto">
        <code className="text-xs text-muted leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function CollapsibleExample({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#70012b]/10 rounded-lg overflow-hidden my-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#130007]/20 hover:bg-[#130007]/30 transition-colors cursor-pointer text-left"
      >
        {open ? (
          <ChevronDown size={14} className="text-muted" />
        ) : (
          <ChevronRight size={14} className="text-muted" />
        )}
        <span className="text-sm text-muted">{title}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function ErrorExample({ status, title, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const color =
    status.startsWith("4") ? "text-yellow-400" :
    status.startsWith("5") ? "text-red-400" :
    "text-green-400";

  return (
    <div className="rounded-lg border border-[#70012b]/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#130007]/40 border-b border-[#70012b]/10">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-bold ${color}`}>{status}</span>
          <span className="text-xs text-muted">{title}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-foreground transition-colors cursor-pointer"
          title="Copy"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="px-4 py-3 bg-black/60 overflow-x-auto">
        <code className="text-xs text-muted leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
