"use client";
import { useEffect, useState } from "react";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const load = (status?: string) => {
    setLoading(true);
    let url = "/api/admin/payouts";
    if (status) url += `?status=${status}`;
    fetch(url).then(r => r.json()).then(d => {
      setPayouts(d.payouts || []);
      setPendingCount(d.pendingCount ?? 0);
      setTotalPending(d.totalPending ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  const viewDetail = async (id: string) => {
    const res = await fetch(`/api/admin/payouts?payoutId=${id}`);
    const d = await res.json();
    setDetail(d);
  };

  const generatePayouts = async () => {
    if (!confirm("Generate payouts for all delivered orders?")) return;
    setGenerating(true);
    const res = await fetch("/api/admin/payouts", { method: "POST" });
    const d = await res.json();
    setGenerating(false);
    alert(`Generated ${d.created} payout(s)`);
    load(filterStatus);
  };

  const markPaid = async (id: string) => {
    const ref = prompt("Payout reference (optional):");
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId: id, status: "paid", payoutReference: ref || undefined }),
    });
    load(filterStatus);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payouts</h1>
        <div className="flex gap-3">
          <button onClick={generatePayouts} disabled={generating} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {generating ? "Generating..." : `Generate Payouts (${pendingCount} pending)`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl p-4 text-yellow-700">
          <p className="text-sm opacity-80 mb-1">Pending Payouts</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-blue-700">
          <p className="text-sm opacity-80 mb-1">Total Amount Pending</p>
          <p className="text-2xl font-bold">₹{totalPending.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["", "pending", "processing", "paid", "failed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border-none ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">Seller</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Period</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Gross Sales</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Net Amount</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.businessName || p.sellerId?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-700">₹{p.grossSales?.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">₹{p.netAmount?.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    p.status === "paid" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    p.status === "processing" ? "bg-blue-100 text-blue-700" :
                    p.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => viewDetail(p.id)} className="text-blue-600 hover:underline text-xs font-medium cursor-pointer bg-transparent border-none">View</button>
                    {p.status === "pending" && (
                      <button onClick={() => markPaid(p.id)} className="text-green-600 hover:underline text-xs font-medium cursor-pointer bg-transparent border-none">Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payouts yet. Generate payouts from delivered orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">Payout #{detail.payout?.id?.slice(0, 8)}</h3>
            <div className="space-y-2 mb-4 text-sm">
              <p><span className="text-gray-400">Gross Sales:</span> <span className="font-medium">₹{detail.payout?.grossSales?.toLocaleString("en-IN")}</span></p>
              <p><span className="text-gray-400">Commission:</span> <span className="font-medium text-red-600">-₹{detail.payout?.totalCommission?.toLocaleString("en-IN")}</span></p>
              <p><span className="text-gray-400">Net Amount:</span> <span className="font-medium text-green-600">₹{detail.payout?.netAmount?.toLocaleString("en-IN")}</span></p>
              <p><span className="text-gray-400">Status:</span> <span className="font-medium capitalize">{detail.payout?.status}</span></p>
              <p><span className="text-gray-400">Period:</span> <span className="font-medium">{new Date(detail.payout?.periodStart).toLocaleDateString()} - {new Date(detail.payout?.periodEnd).toLocaleDateString()}</span></p>
            </div>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Transactions</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {detail.transactions?.map((t: any) => (
                <div key={t.id} className="flex justify-between text-xs py-1 border-b border-gray-50">
                  <span className="text-gray-500 capitalize">{t.type}</span>
                  <span className={t.amount > 0 ? "text-green-600" : "text-red-600"}>₹{Math.abs(t.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {(!detail.transactions || detail.transactions.length === 0) && (
                <p className="text-xs text-gray-400">No transactions</p>
              )}
            </div>
            <button onClick={() => setDetail(null)} className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
