"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/seller/products/${id}`).then(r => r.json()).then(d => {
      const p = d.product;
      setForm({
        name: p.name || "", description: p.description || "", brand: p.brand || "",
        category: p.category || "", subcategory: p.subcategory || "",
        mrp: p.mrp || 0, sellingPrice: p.sellingPrice || 0, sku: p.sku || "", barcode: p.barcode || "",
        stock: p.stock || 0, lowStockThreshold: p.lowStockThreshold || 5,
        weight: p.weight || 0, length: p.length || 0, width: p.width || 0, height: p.height || 0,
        shipsFrom: p.shipsFrom || "", handlingTime: p.handlingTime || 1,
        fulfillmentMethod: p.fulfillmentMethod || "self",
        searchTitle: p.searchTitle || "", tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
        keywords: Array.isArray(p.keywords) ? p.keywords.join(", ") : "",
        status: p.status || "draft",
      });
      setVariants(d.variants || []);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (status?: string) => {
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
      keywords: form.keywords ? form.keywords.split(",").map((t: string) => t.trim()) : [],
      discount: form.mrp > form.sellingPrice ? form.mrp - form.sellingPrice : 0,
      status: status || form.status,
    };

    const res = await fetch(`/api/seller/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false); return; }

    if (variants.length > 0) {
      await fetch(`/api/seller/products/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variants),
      });
    }

    setSaving(false);
    router.push("/vendor/products");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Product</h1>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => setForm((prev: any) => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">MRP *</label>
              <input type="number" value={form.mrp} onChange={e => setForm((prev: any) => ({ ...prev, mrp: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Selling Price *</label>
              <input type="number" value={form.sellingPrice} onChange={e => setForm((prev: any) => ({ ...prev, sellingPrice: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Stock *</label>
              <input type="number" value={form.stock} onChange={e => setForm((prev: any) => ({ ...prev, stock: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm((prev: any) => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="fashion">Fashion</option>
                <option value="electronics">Electronics</option>
                <option value="mobile">Mobiles</option>
                <option value="beauty">Beauty</option>
                <option value="food">Grocery</option>
                <option value="furniture">Furniture</option>
                <option value="sports">Sports</option>
                <option value="books">Books</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => router.push("/vendor/products")} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => handleSave("draft")} disabled={saving} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Save as Draft</button>
          <button onClick={() => handleSave("active")} disabled={saving} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save & Publish
          </button>
        </div>
      </div>
    </div>
  );
}
