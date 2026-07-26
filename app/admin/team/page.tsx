"use client";
import { useEffect, useState } from "react";

type TeamRole = "sub_admin" | "employee";
type Member = { id: string; name: string; email: string; role: TeamRole; createdAt: string };

const ROLE_LABEL: Record<TeamRole, string> = { sub_admin: "Sub Admin", employee: "Employee" };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sub_admin" as TeamRole });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/team")
      .then((r) => r.json())
      .then((d) => { setMembers(d.members || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "sub_admin" });
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to create");
    }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-b2w-navy mb-6">Team</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border border-b2w-border p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs text-b2w-muted mb-1">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-9 px-3 border border-b2w-border rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-b2w-muted mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-9 px-3 border border-b2w-border rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-b2w-muted mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full h-9 px-3 border border-b2w-border rounded-lg text-sm" required minLength={8} />
        </div>
        <div>
          <label className="block text-xs text-b2w-muted mb-1">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}
            className="w-full h-9 px-3 border border-b2w-border rounded-lg text-sm">
            <option value="sub_admin">Sub Admin</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <button type="submit" disabled={submitting}
          className="h-9 bg-b2w-brand text-white rounded-lg text-sm font-semibold disabled:opacity-50">
          {submitting ? "Creating..." : "Add Member"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-b2w-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-b2w-bg border-b border-b2w-border text-left">
              <th className="px-4 py-3 text-b2w-muted font-medium">Name</th>
              <th className="px-4 py-3 text-b2w-muted font-medium">Email</th>
              <th className="px-4 py-3 text-b2w-muted font-medium">Role</th>
              <th className="px-4 py-3 text-b2w-muted font-medium">Added</th>
              <th className="px-4 py-3 text-b2w-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-b2w-border last:border-0">
                <td className="px-4 py-3 font-medium text-b2w-navy">{m.name}</td>
                <td className="px-4 py-3 text-b2w-muted">{m.email}</td>
                <td className="px-4 py-3">{ROLE_LABEL[m.role]}</td>
                <td className="px-4 py-3 text-b2w-muted">{new Date(m.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(m.id)} className="text-red-600 hover:underline text-xs font-medium">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!loading && members.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-b2w-muted">No team members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}