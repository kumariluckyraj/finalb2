"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, Shield, User, Store } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  orderCount: string;
  createdAt: string;
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  vendor: Store,
  customer: User,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  vendor: "bg-orange-100 text-orange-700",
  customer: "bg-blue-100 text-blue-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const d = await res.json();
      setUsers(d.users ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user and all their data?")) return;
    setDeleting(id);
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleting(null);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    vendor: users.filter((u) => u.role === "vendor").length,
    customer: users.filter((u) => u.role === "customer").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-b2w-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Users</h1>
          <p className="text-sm text-b2w-muted mt-0.5">{users.length} registered users</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-b2w-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-b2w-border text-sm bg-white text-b2w-navy focus:outline-none focus:ring-2 focus:ring-b2w-brand/20 focus:border-b2w-brand"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "customer", "vendor", "admin"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              roleFilter === f
                ? "bg-b2w-brand text-white border-b2w-brand"
                : "bg-white text-b2w-body border-b2w-border hover:border-b2w-brand/40"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 text-[11px] ${roleFilter === f ? "text-white/70" : "text-b2w-muted"}`}>
              ({counts[f]})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-b2w-border p-12 text-center">
          <p className="text-b2w-muted text-sm">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-b2w-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-b2w-border bg-b2w-bg text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider text-right">Orders</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] ?? User;
                  return (
                    <tr key={u.id} className="border-b border-b2w-border last:border-0 hover:bg-b2w-bg/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-b2w-bg border border-b2w-border flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-b2w-navy">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-b2w-navy">{u.name}</p>
                            <p className="text-xs text-b2w-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                          <RoleIcon className="w-3 h-3" />
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-b2w-navy">{u.orderCount}</td>
                      <td className="px-4 py-3 text-xs text-b2w-muted">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deleting === u.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-b2w-muted hover:text-b2w-red transition cursor-pointer bg-transparent border-none disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
