"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
  unlisted: "bg-red-100 text-red-700",
};

function AddProductModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">How will this product be fulfilled?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 -mt-2 mb-2">
            Choose who will handle shipping, tracking, and returns for this product.
          </p>

          {/* Self-managed option */}
          <Link
            href="/vendor/products/new?logistics=self"
            className="block border border-gray-200 rounded-xl p-4 hover:border-brand-blue hover:bg-blue-50/40 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13l4 4v6a1 1 0 01-1 1h-2M3 7v10a1 1 0 001 1h2m10-11V6a1 1 0 00-1-1H4a1 1 0 00-1 1v1m13 11a2 2 0 11-4 0 2 2 0 014 0zM7 17a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-brand-blue transition">
                  I&apos;ll handle logistics myself
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll be responsible for shipping, tracking, and processing returns for this product.
                </p>
              </div>
            </div>
          </Link>

          {/* Admin-managed option */}
          <Link
            href="/vendor/products/new?logistics=admin"
            className="block border border-gray-200 rounded-xl p-4 hover:border-brand-blue hover:bg-blue-50/40 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-brand-blue transition">
                  Let B2World handle logistics
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  B2World admin will manage shipping, tracking, and returns on your behalf.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

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
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue transition"
        >
          + Add Product
        </button>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="text-brand-blue hover:underline text-sm"
          >
            Add your first product
          </button>
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

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}