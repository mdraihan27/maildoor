/**
 * API Keys Page — List, create, revoke, and delete API keys.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Key } from "lucide-react";
import { apiKeys as apiKeysApi } from "@/lib/api";
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

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

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
      title="API Keys"
      description="Manage your API keys for programmatic access."
      actions={
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus size={14} />
          Create Key
        </Button>
      }
    >
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
