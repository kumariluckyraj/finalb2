"use client";
import { useEffect, useState } from "react";

export default function PayoutsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const load = () => {
    fetch("/api/seller/payouts").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id: string) => {
    const res = await fetch(`/api/seller/payouts?payoutId=${id}`);
    const d = await res.json();
    setDetail(d);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { payouts = [], summary } = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payouts</h1>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600 mb-1">Gross Sales</p>
            <p className="text-xl font-bold text-green-700">₹{summary.grossSales?.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600 mb-1">Net Payout</p>
            <p className="text-xl font-bold text-blue-700">₹{summary.netAmount?.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-yellow-600 mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-700">₹{summary.pendingPayout?.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}

      {payouts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No payouts yet</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">Period</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Gross Sales</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Net Amount</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Paid At</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">₹{p.grossSales?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 font-medium">₹{p.netAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => viewDetail(p.id)} className="text-purple-600 hover:underline text-xs font-medium cursor-pointer bg-transparent border-none">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">Payout Breakdown</h3>
            <div className="space-y-2 mb-4 text-sm">
              <p className="flex justify-between"><span className="text-gray-400">Gross Sales:</span> <span className="font-medium">₹{detail.payout?.grossSales?.toLocaleString("en-IN")}</span></p>
              <p className="flex justify-between"><span className="text-gray-400">Commission Deducted:</span> <span className="font-medium text-red-600">-₹{detail.payout?.totalCommission?.toLocaleString("en-IN")}</span></p>
              <hr className="border-gray-100" />
              <p className="flex justify-between"><span className="text-gray-400">Net Amount:</span> <span className="font-medium text-green-600">₹{detail.payout?.netAmount?.toLocaleString("en-IN")}</span></p>
              <p className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="font-medium capitalize">{detail.payout?.status}</span></p>
              <p className="flex justify-between"><span className="text-gray-400">Period:</span> <span className="font-medium">{new Date(detail.payout?.periodStart).toLocaleDateString()} - {new Date(detail.payout?.periodEnd).toLocaleDateString()}</span></p>
            </div>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Transactions</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {detail.transactions?.map((t: any) => (
                <div key={t.id} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
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
