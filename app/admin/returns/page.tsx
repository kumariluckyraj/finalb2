"use client";
import { useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  picked_up: "bg-blue-100 text-blue-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  const load = () => {
    fetch("/api/admin/returns").then(r => r.json()).then(d => { setReturns(d.returns || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const addNote = async (id: string) => {
    const note = adminNote[id];
    if (!note) return;
    await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminNote: note }),
    });
    setAdminNote(prev => ({ ...prev, [id]: "" }));
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const byStatus = (status: string) => returns.filter(r => r.status === status).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Return Requests — Admin</h1>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {["pending", "approved", "picked_up", "refunded", "rejected"].map(s => (
          <div key={s} className={`rounded-xl p-4 ${STATUS_COLORS[s]} bg-opacity-30`}>
            <p className="text-xs opacity-80 mb-1 capitalize">{s}</p>
            <p className="text-2xl font-bold">{byStatus(s)}</p>
          </div>
        ))}
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No return requests</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Reason</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Refund</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Pickup</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Admin Note</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{r.reason}</p>
                    {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium">{r.refundAmount ? `₹${r.refundAmount}` : "—"}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] capitalize ${r.refundStatus === "completed" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>{r.refundStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.pickupScheduledAt ? (
                      <>
                        <p>{new Date(r.pickupScheduledAt).toLocaleDateString()}</p>
                        {r.pickupAddress && <p className="text-gray-400 truncate max-w-[120px]">{r.pickupAddress}</p>}
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <input
                        value={adminNote[r.id] ?? ""}
                        onChange={e => setAdminNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder={r.adminNote ? r.adminNote : "Add note..."}
                        className="w-28 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                      <button
                        onClick={() => addNote(r.id)}
                        disabled={!adminNote[r.id]?.trim()}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 border-none cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
