/**
 * API Keys Page — List, create, revoke, and delete API keys + manage App Password.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Key, Lock, Eye, EyeOff, Check, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import { apiKeys as apiKeysApi, users as usersApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import KeyRow from "@/components/api-keys/KeyRow";
import CreateKeyModal from "@/components/api-keys/CreateKeyModal";
import { toast } from "@/components/ui/Toast";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // ─── App Password state ─────────────────────────────────
  const [hasAppPassword, setHasAppPassword] = useState(false);
  const [appPasswordLoading, setAppPasswordLoading] = useState(true);
  const [appPasswordInput, setAppPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  /** Fetch API keys list */
  const fetchKeys = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiKeysApi.list({ page: p, limit: 10 });
      setKeys(res.data || []);
      setMeta(res.meta || {});
      setPage(p);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetch app password status */
  const fetchAppPasswordStatus = useCallback(async () => {
    setAppPasswordLoading(true);
    try {
      const res = await usersApi.appPasswordStatus();
      setHasAppPassword(res.data?.hasAppPassword || false);
    } catch {
      // Silently fail
    } finally {
      setAppPasswordLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchAppPasswordStatus();
  }, [fetchKeys, fetchAppPasswordStatus]);

  /** Save app password */
  const handleSaveAppPassword = async () => {
    if (!appPasswordInput.trim()) {
      toast.error("Please enter your App Password");
      return;
    }
    setSaving(true);
    try {
      await usersApi.setAppPassword(appPasswordInput);
      toast.success("App Password saved successfully");
      setHasAppPassword(true);
      setAppPasswordInput("");
      setShowPassword(false);
    } catch (err) {
      toast.error(err.message || "Failed to save App Password");
    } finally {
      setSaving(false);
    }
  };

  /** Verify app password */
  const handleVerifyAppPassword = async () => {
    if (!appPasswordInput.trim()) {
      toast.error("Please enter an App Password to verify");
      return;
    }
    setVerifying(true);
    try {
      const res = await usersApi.verifyAppPassword(appPasswordInput);
      if (res.data?.valid) {
        toast.success("App Password is valid!");
      } else {
        toast.error(res.data?.message || "App Password verification failed");
      }
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  /** Remove app password */
  const handleRemoveAppPassword = async () => {
    try {
      await usersApi.removeAppPassword();
      toast.success("App Password removed");
      setHasAppPassword(false);
      setAppPasswordInput("");
    } catch (err) {
      toast.error(err.message || "Failed to remove App Password");
    }
  };

  /** Revoke a key */
  const handleRevoke = async (id) => {
    try {
      await apiKeysApi.revoke(id);
      toast.success("API key revoked");
      fetchKeys(page);
    } catch (err) {
      toast.error(err.message || "Failed to revoke key");
    }
  };

  /** Delete a key */
  const handleDelete = async (id) => {
    try {
      await apiKeysApi.delete(id);
      toast.success("API key deleted");
      fetchKeys(page);
    } catch (err) {
      toast.error(err.message || "Failed to delete key");
    }
  };

  return (
    <DashboardShell
      title="API Keys & Email Setup"
      description="Configure your Gmail App Password and manage API keys for sending emails."
    >
      {/* ─── App Password Section ─────────────────────────────── */}
      <div className="mb-8 rounded-xl border border-[#70012b]/10 bg-[#130007]/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex rounded-lg bg-[#70012b]/10 p-2">
            <Lock size={18} className="text-[#70012b]" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Gmail App Password</h2>
            <p className="text-xs text-muted">
              Required to send emails through your Gmail account via SMTP.
            </p>
          </div>
        </div>

        {appPasswordLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size={18} />
          </div>
        ) : (
          <>
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  hasAppPassword ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-sm text-muted">
                {hasAppPassword
                  ? "App Password is configured"
                  : "No App Password configured — you must set one before sending emails"}
              </span>
            </div>

            {/* Input field */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={appPasswordInput}
                  onChange={(e) => setAppPasswordInput(e.target.value)}
                  placeholder={
                    hasAppPassword
                      ? "Enter new App Password to update"
                      : "Enter your 16-character App Password"
                  }
                  className="w-full rounded-lg border border-[#70012b]/20 bg-black/40 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted/50 focus:border-[#70012b]/40 focus:outline-none focus:ring-1 focus:ring-[#70012b]/20 font-mono tracking-wider"
                  maxLength={19}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyAppPassword}
                  size="sm"
                  variant="secondary"
                  disabled={verifying || !appPasswordInput.trim()}
                >
                  {verifying ? <Spinner size={14} /> : <Check size={14} />}
                  Verify
                </Button>
                <Button
                  onClick={handleSaveAppPassword}
                  size="sm"
                  disabled={saving || !appPasswordInput.trim()}
                >
                  {saving ? <Spinner size={14} /> : <Lock size={14} />}
                  {hasAppPassword ? "Update" : "Save"}
                </Button>
                {hasAppPassword && (
                  <Button
                    onClick={handleRemoveAppPassword}
                    size="sm"
                    variant="danger"
                  >
                    <Trash2 size={14} />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Help text */}
            <div className="mt-4 rounded-lg border border-[#70012b]/5 bg-[#130007]/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-[#70012b] mt-0.5 shrink-0" />
                <div className="text-xs text-muted leading-relaxed space-y-1">
                  <p>
                    <strong>How to get an App Password:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-1">
                    <li>
                      Enable 2-Step Verification on your Google Account
                    </li>
                    <li>
                      Go to{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#70012b] hover:text-[#e0a0b8] inline-flex items-center gap-0.5"
                      >
                        Google App Passwords
                        <ExternalLink size={10} />
                      </a>
                    </li>
                    <li>Select &quot;Mail&quot; and generate a new password</li>
                    <li>Paste the 16-character password above</li>
                  </ol>
                  <p className="mt-2">
                    Your App Password is encrypted (AES-256-GCM) before storage and never visible again.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── API Keys Section ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">API Keys</h2>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus size={14} />
          Create Key
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys yet"
          description="Create your first API key to start sending emails programmatically."
        >
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus size={14} />
            Create Key
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <KeyRow
              key={key._id}
              apiKey={key}
              onRevoke={handleRevoke}
              onDelete={handleDelete}
            />
          ))}

          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={(p) => fetchKeys(p)}
          />
        </div>
      )}

      {/* Create key modal */}
      <CreateKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => fetchKeys(1)}
      />
    </DashboardShell>
  );
}
