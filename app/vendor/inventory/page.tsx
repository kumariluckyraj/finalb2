"use client";
import { useEffect, useState } from "react";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<Record<string, number>>({});

  const load = () => {
    let url = "/api/seller/inventory";
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStockOnly) params.set("lowStock", "true");
    const qs = params.toString();
    if (qs) url += "?" + qs;

    fetch(url).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [search, lowStockOnly]);

  const handleBulkUpdate = async () => {
    const bulkStock = Object.entries(editing).map(([id, stock]) => ({ id, stock }));
    if (bulkStock.length === 0) return;

    await fetch("/api/seller/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulkStock, reason: "Bulk stock update" }),
    });

    setEditing({});
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        {Object.keys(editing).length > 0 && (
          <button onClick={handleBulkUpdate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
            Save {Object.keys(editing).length} Change(s)
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="accent-purple-600" />
          Low stock only
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">Product</th>
                <th className="px-4 py-3 text-gray-500 font-medium">SKU</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Original Stock</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Current Stock</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Low Threshold</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${p.stock <= p.lowStockThreshold ? "bg-red-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.sku || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.totalStockAdded ?? p.stock}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editing[p.id] ?? p.stock}
                        onChange={e => setEditing(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                        className={`w-20 px-2 py-1 border rounded-lg text-sm ${p.stock <= p.lowStockThreshold ? "border-red-300" : "border-gray-200"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.lowStockThreshold}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
