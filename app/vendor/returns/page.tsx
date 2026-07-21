"use client";
import { useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  picked_up: "bg-blue-100 text-blue-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupForm, setPickupForm] = useState<Record<string, { address: string; date: string; notes: string }>>({});
  const [refundAmounts, setRefundAmounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = () => {
    fetch("/api/seller/returns").then(r => r.json()).then(d => { setReturns(d.returns || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, status: string, refundAmount?: number) => {
    await fetch(`/api/seller/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, refundAmount }),
    });
    load();
  };

  const handleSchedulePickup = async (id: string) => {
    const pf = pickupForm[id];
    if (!pf?.address || !pf?.date) return;
    await fetch("/api/seller/returns/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId: id, pickupAddress: pf.address, pickupDate: pf.date, pickupNotes: pf.notes }),
    });
    setPickupForm(prev => ({ ...prev, [id]: { address: "", date: "", notes: "" } }));
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const pendingCount = returns.filter(r => r.status === "pending").length;
  const needsRefundCount = returns.filter(r => r.status === "approved" || r.status === "picked_up").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Return Requests</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 mb-1">Need Refund</p>
          <p className="text-2xl font-bold text-blue-700">{needsRefundCount}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-gray-700">{returns.length}</p>
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No return requests</div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    {r.refundStatus !== "pending" && r.status !== "pending" && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        r.refundStatus === "completed" ? "bg-green-100 text-green-700" :
                        r.refundStatus === "processing" ? "bg-blue-100 text-blue-700" :
                        r.refundStatus === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      }`}>Refund: {r.refundStatus}</span>
                    )}
                    {r.refundAmount && <span className="text-xs font-medium text-gray-500">₹{r.refundAmount}</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 font-medium">{r.reason}</p>
                  {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}

                  {/* Pickup info */}
                  {r.pickupAddress && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                      <p className="text-blue-700 font-medium">Pickup scheduled</p>
                      <p className="text-blue-600">{r.pickupAddress}</p>
                      {r.pickupScheduledAt && <p className="text-blue-500">{new Date(r.pickupScheduledAt).toLocaleString()}</p>}
                      {r.pickupNotes && <p className="text-blue-500">Note: {r.pickupNotes}</p>}
                    </div>
                  )}

                  {/* Timeline */}
                  {r.timeline?.length > 0 && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className="mt-2 text-xs text-purple-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      {expanded[r.id] ? "Hide" : "Show"} timeline ({r.timeline.length} events)
                    </button>
                  )}
                  {expanded[r.id] && r.timeline?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {r.timeline.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                          <span className="capitalize">{t.status}</span>
                          <span>{new Date(t.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4 shrink-0">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => handleAction(r.id, "approved")} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 border-none cursor-pointer">Approve</button>
                      <button onClick={() => handleAction(r.id, "rejected")} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border-none cursor-pointer">Reject</button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <>
                      {/* Schedule pickup */}
                      <button
                        onClick={() => {
                          const pf = pickupForm[r.id];
                          if (pf?.address) {
                            handleSchedulePickup(r.id);
                          } else {
                            setPickupForm(prev => ({ ...prev, [r.id]: { address: "", date: "", notes: "" } }));
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border-none cursor-pointer"
                      >
                        {pickupForm[r.id]?.address ? "Schedule Pickup" : "Pickup"}
                      </button>
                      {pickupForm[r.id] !== undefined && !pickupForm[r.id]?.address && (
                        <div className="flex flex-col gap-1 mt-1">
                          <input
                            placeholder="Pickup address"
                            value={pickupForm[r.id]?.address || ""}
                            onChange={e => setPickupForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], address: e.target.value } }))}
                            className="w-48 px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="datetime-local"
                            value={pickupForm[r.id]?.date || ""}
                            onChange={e => setPickupForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], date: e.target.value } }))}
                            className="w-48 px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            placeholder="Pickup notes (optional)"
                            value={pickupForm[r.id]?.notes || ""}
                            onChange={e => setPickupForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], notes: e.target.value } }))}
                            className="w-48 px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <button
                            onClick={() => handleSchedulePickup(r.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 border-none cursor-pointer"
                          >
                            Confirm Pickup
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {(r.status === "picked_up" || r.status === "approved") && (
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        placeholder={r.refundAmount ? `₹${r.refundAmount}` : "Refund amount"}
                        value={refundAmounts[r.id] ?? ""}
                        onChange={e => setRefundAmounts(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                        className="w-28 px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                      <button
                        onClick={() => handleAction(r.id, "refunded", refundAmounts[r.id] || r.refundAmount || 0)}
                        className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 border-none cursor-pointer"
                      >
                        Mark Refunded
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
