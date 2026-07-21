"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
  unlisted: "bg-red-100 text-red-700",
};

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = (status = "") => {
    setLoading(true);
    const url = status ? `/api/seller/products?status=${status}` : "/api/seller/products";
    fetch(url).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (s: string) => { setFilter(s); load(s); };
  const handleAction = async (id: string, action: string) => {
    await fetch(`/api/seller/products/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load(filter);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <Link href="/vendor/products/new" className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue transition">+ Add Product</Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "draft", "active", "archived", "unlisted"].map(s => (
          <button key={s} onClick={() => handleFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-lg mb-2">No products yet</p>
          <Link href="/vendor/products/new" className="text-brand-blue hover:underline text-sm">Add your first product</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">Product</th>
                <th className="px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Price</th>
                <th className="px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Stock</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}{p.subcategory ? ` / ${p.subcategory}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium">₹{p.sellingPrice?.toLocaleString("en-IN")}</p>
                    {p.mrp > p.sellingPrice && <p className="text-xs text-gray-400 line-through">₹{p.mrp?.toLocaleString("en-IN")}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={p.stock <= p.lowStockThreshold ? "text-red-600 font-medium" : "text-gray-600"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] || "bg-gray-100"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link href={`/vendor/products/${p.id}`} className="px-2 py-1 text-xs text-brand-blue hover:bg-blue-50 rounded-lg">Edit</Link>
                      <button onClick={() => handleAction(p.id, "duplicate")} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded-lg">Copy</button>
                      {p.status === "active" ? (
                        <button onClick={() => handleAction(p.id, "unlist")} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg">Unlist</button>
                      ) : (
                        <button onClick={() => handleAction(p.id, "archive")} className="px-2 py-1 text-xs text-yellow-500 hover:bg-yellow-50 rounded-lg">Archive</button>
                      )}
                    </div>
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
