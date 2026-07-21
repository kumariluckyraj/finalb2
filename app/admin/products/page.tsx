"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, AlertCircle } from "lucide-react";

interface Product {
  _id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  actualPrice: number;
  discount: number;
  stock: number | null;
  image: string;
  vendorId: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      const d = await res.json();
      setProducts(d.products ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product permanently?")) return;
    setDeleting(id);
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-b2w-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Products</h1>
          <p className="text-sm text-b2w-muted mt-0.5">{products.length} products across all vendors</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-b2w-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-b2w-border text-sm bg-white text-b2w-navy focus:outline-none focus:ring-2 focus:ring-b2w-brand/20 focus:border-b2w-brand"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-b2w-border p-12 text-center">
          <AlertCircle className="w-8 h-8 text-b2w-muted mx-auto mb-3" />
          <p className="text-b2w-muted text-sm">
            {search ? "No products match your search" : "No products found"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-b2w-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-b2w-border bg-b2w-bg text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider text-right">Discount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider text-right">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-b2w-muted uppercase tracking-wider">Added</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-b border-b2w-border last:border-0 hover:bg-b2w-bg/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-b2w-border bg-b2w-bg overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-b2w-muted">N/A</span>
                          )}
                        </div>
                        <span className="font-medium text-b2w-navy max-w-[200px] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-b2w-body capitalize">{p.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-b2w-navy">₹{p.price.toLocaleString("en-IN")}</span>
                      {p.actualPrice > p.price && (
                        <span className="text-xs text-b2w-muted line-through ml-1">₹{p.actualPrice.toLocaleString("en-IN")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.discount > 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          {p.discount}% off
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.stock !== null && p.stock <= 5 ? "text-b2w-red" : "text-b2w-body"}`}>
                        {p.stock !== null ? p.stock : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-b2w-muted">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-b2w-muted hover:text-b2w-red transition cursor-pointer bg-transparent border-none disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
