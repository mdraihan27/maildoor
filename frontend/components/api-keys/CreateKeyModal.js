/**
 * CreateKeyModal — Modal form for creating a new API key.
 */
"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { apiKeys as apiKeysApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export default function CreateKeyModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [allowedIPs, setAllowedIPs] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = { name };
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
      if (allowedIPs.trim()) {
        body.allowedIPs = allowedIPs
          .split(",")
          .map((ip) => ip.trim())
          .filter(Boolean);
      }

      const res = await apiKeysApi.create(body);
      setCreatedKey(res.data.key);
      toast.success("API key created successfully");
      onCreated?.();
    } catch (err) {
      toast.error(err.message || "Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(createdKey);
    if (ok) {
      setCopied(true);
      toast.success("Key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName("");
    setExpiresAt("");
    setAllowedIPs("");
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create API Key">
      {createdKey ? (
        /* ─── Show the plaintext key (once) ─── */
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-900/10 border border-amber-800/20">
            <AlertTriangle
              size={16}
              className="text-amber-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-300 leading-relaxed">
              Copy this key now — it will <strong>never</strong> be shown again.
            </p>
          </div>

          {/* Key display */}
          <div className="relative">
            <code className="block w-full rounded-lg bg-[#130007]/60 border border-[#70012b]/20 p-3 text-xs text-foreground break-all font-mono leading-relaxed">
              {createdKey}
            </code>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-[#70012b]/20 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckCircle size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      ) : (
        /* ─── Creation form ─── */
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Key Name"
            placeholder="e.g. Production Server"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
          <Input
            label="Expires At (optional)"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <Input
            label="Allowed IPs (optional, comma-separated)"
            placeholder="203.0.113.50, 198.51.100.25"
            value={allowedIPs}
            onChange={(e) => setAllowedIPs(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Key
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
