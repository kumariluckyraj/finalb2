"use client";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");

  useEffect(() => {
    fetch(`/api/seller/analytics?period=${period}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [period]);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { revenue = [], topProducts = [], stats } = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h1>

      <div className="flex gap-2 mb-6">
        {["weekly", "monthly", "yearly"].map(p => (
          <button key={p} onClick={() => { setLoading(true); setPeriod(p); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${period === p ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{p}</button>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4"><p className="text-sm text-blue-600 mb-1">Total Orders</p><p className="text-xl font-bold text-blue-700">{stats.totalOrders}</p></div>
          <div className="bg-green-50 rounded-xl p-4"><p className="text-sm text-green-600 mb-1">Revenue</p><p className="text-xl font-bold text-green-700">₹{stats.revenue?.toLocaleString("en-IN")}</p></div>
          <div className="bg-yellow-50 rounded-xl p-4"><p className="text-sm text-yellow-600 mb-1">Pending</p><p className="text-xl font-bold text-yellow-700">{stats.pendingOrders}</p></div>
          <div className="bg-orange-50 rounded-xl p-4"><p className="text-sm text-orange-600 mb-1">Returns</p><p className="text-xl font-bold text-orange-700">{stats.returns}</p></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
          {revenue.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data for this period</p>
          ) : (
            <div className="space-y-2">
              {revenue.map((r: any) => (
                <div key={r.date} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{new Date(r.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800">₹{Number(r.revenue).toLocaleString("en-IN")}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.orders} orders</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data for this period</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{p.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800">₹{Number(p.revenue).toLocaleString("en-IN")}</span>
                    <span className="text-xs text-gray-400 ml-2">{p.orders} orders</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
