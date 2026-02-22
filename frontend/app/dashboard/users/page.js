/**
 * Users Admin Page — List, filter, and manage users.
 * Accessible only to ADMIN and SUPERADMIN roles.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { users as usersApi } from "@/lib/api";
import DashboardShell from "@/components/layout/DashboardShell";
import UserFilters from "@/components/users/UserFilters";
import UserRow from "@/components/users/UserRow";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

export default function UsersPage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [userList, setUserList] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", role: "" });

  /* Redirect non-admins */
  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  /** Fetch users */
  const fetchUsers = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 15 };
        if (filters.status) params.status = filters.status;
        if (filters.role) params.role = filters.role;

        const res = await usersApi.list(params);
        setUserList(res.data || []);
        setMeta(res.meta || {});
        setPage(p);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (isAdmin) fetchUsers(1);
  }, [isAdmin, fetchUsers]);

  /** Suspend user */
  const handleSuspend = async (id) => {
    try {
      await usersApi.suspend(id);
      toast.success("User suspended");
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || "Failed to suspend user");
    }
  };

  /** Reactivate user */
  const handleReactivate = async (id) => {
    try {
      await usersApi.reactivate(id);
      toast.success("User reactivated");
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || "Failed to reactivate user");
    }
  };

  /** Change role (superadmin only) */
  const handleChangeRole = async (id, role) => {
    try {
      await usersApi.changeRole(id, role);
      toast.success(`Role changed to ${role}`);
      fetchUsers(page);
    } catch (err) {
      toast.error(err.message || "Failed to change role");
    }
  };

  if (!isAdmin) return null;

  return (
    <DashboardShell
      title="User Management"
      description="View and manage all registered users."
    >
      {/* Filters */}
      <UserFilters filters={filters} onChange={setFilters} />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      ) : userList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match the current filters."
        />
      ) : (
        <div className="space-y-2">
          {userList.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              currentUserId={currentUser?._id}
              isSuperAdmin={isSuperAdmin}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onChangeRole={handleChangeRole}
            />
          ))}

          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={(p) => fetchUsers(p)}
          />
        </div>
      )}
    </DashboardShell>
  );
}
