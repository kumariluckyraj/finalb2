"use client";
import { useEffect, useState } from "react";

export default function PincodeCoveragePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newPincode, setNewPincode] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/seller/pincodes")
      .then(r => r.json())
      .then(d => {
        setProducts(d.products || []);
        setStats(d.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addPincode = async (productId: string) => {
    const pincode = newPincode[productId]?.trim();
    if (!pincode || !/^\d{6}$/.test(pincode)) return;
    const res = await fetch("/api/seller/pincodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, pincode }),
    });
    if (res.ok) {
      setNewPincode(prev => ({ ...prev, [productId]: "" }));
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to add pincode");
    }
  };

  const removePincode = async (productId: string, pincode: string) => {
    await fetch("/api/seller/pincodes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, pincode }),
    });
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pincode Coverage</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-blue-700">
            <p className="text-sm opacity-80 mb-1">Active Products</p>
            <p className="text-2xl font-bold">{stats.totalActive}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-green-700">
            <p className="text-sm opacity-80 mb-1">With Coverage</p>
            <p className="text-2xl font-bold">{stats.withPincodes}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-purple-700">
            <p className="text-sm opacity-80 mb-1">Total Pincode Entries</p>
            <p className="text-2xl font-bold">{stats.totalPincodeEntries}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">Product</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Price</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Ships From</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Pincodes</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  ₹{p.sellingPrice?.toLocaleString("en-IN")}
                  {p.mrp > p.sellingPrice && (
                    <span className="text-gray-400 line-through ml-1 text-xs">₹{p.mrp?.toLocaleString("en-IN")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.shipsFrom || "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="text-brand-blue hover:underline text-xs font-medium"
                  >
                    {p.pincodeCount} pincode(s) {expanded[p.id] ? "▲" : "▼"}
                  </button>
                  {expanded[p.id] && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.pincodes?.map((pc: string) => (
                        <span key={pc} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                          {pc}
                          <button onClick={() => removePincode(p.id, pc)} className="text-red-500 hover:text-red-700 ml-0.5">&times;</button>
                        </span>
                      ))}
                      {(!p.pincodes || p.pincodes.length === 0) && (
                        <span className="text-xs text-gray-400">No pincodes added</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <input
                      value={newPincode[p.id] || ""}
                      onChange={e => setNewPincode(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="6-digit"
                      maxLength={6}
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => addPincode(p.id)}
                      disabled={!/^\d{6}$/.test(newPincode[p.id] || "")}
                      className="px-2 py-1 bg-brand-blue text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No active products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
