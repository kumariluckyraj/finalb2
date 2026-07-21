"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["fashion", "electronics", "mobile", "beauty", "food", "furniture", "sports", "books"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", description: "", brand: "", category: "", subcategory: "",
    mrp: 0, sellingPrice: 0, sku: "", barcode: "",
    stock: 0, lowStockThreshold: 5,
    weight: 0, weightUnit: "kg", length: 0, width: 0, height: 0,
    
    shipsFrom: "",    warehouseAddress: "", warehouseCity: "", warehouseState: "", warehousePincode: "", handlingTime: 1, fulfillmentMethod: "self",
    searchTitle: "", tags: "", keywords: "",
  });

  const update = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));

  const addVariant = () => setVariants([...variants, { name: "", sku: "", price: 0, stock: 0, imageUrl: "", attributes: {}, sortOrder: variants.length }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, f: string, v: any) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], [f]: v };
    setVariants(updated);
  };

  const handleImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`"${file.name}" exceeds 5MB limit`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image`);
        continue;
      }
      valid.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...previews]);
    setError("");
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "seller-products");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (status: string) => {
    if (status === "active" && imageFiles.length === 0) {
      setError("Please add at least one product image before publishing");
      return;
    }
    if (status === "active" && (!form.warehouseCity || !form.warehousePincode)) {
  setError("Please add warehouse city and pincode before publishing");
  setLoading(false);
  return;
}

    setLoading(true);
    setError("");

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
      keywords: form.keywords ? form.keywords.split(",").map((t: string) => t.trim()) : [],
      discount: form.mrp > form.sellingPrice ? form.mrp - form.sellingPrice : 0,
      status,
    };

    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to create product"); setLoading(false); return; }

    const productId = data.product.id;

    if (variants.length > 0) {
      await fetch(`/api/seller/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variants),
      });
    }

    if (imageFiles.length > 0) {
      try {
        const uploads = imageFiles.map(f => uploadToCloudinary(f));
        const urls = await Promise.all(uploads);

        for (let i = 0; i < urls.length; i++) {
          await fetch(`/api/seller/products/${productId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urls[i], type: "image", isPrimary: i === 0 }),
          });
        }
      } catch (err: any) {
        setError(err.message || "Image upload failed. Product was created but images were not saved.");
        setLoading(false);
        return;
      }
    }

    router.push("/vendor/products");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Product Name *</label>
              <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
              <input value={form.brand} onChange={e => update("brand", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Subcategory</label>
              <input value={form.subcategory} onChange={e => update("subcategory", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">SKU</label>
              <input value={form.sku} onChange={e => update("sku", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Barcode</label>
              <input value={form.barcode} onChange={e => update("barcode", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
                {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[10px] text-center py-0.5">Primary</span>}
              </div>
            ))}
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-400 transition text-gray-400 text-2xl">
              +
              <input type="file" accept="image/*" multiple onChange={handleImagesSelected} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400">Max 5MB per image. PNG, JPG, WebP accepted. First image = primary.</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">MRP *</label>
              <input type="number" value={form.mrp} onChange={e => update("mrp", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Selling Price *</label>
              <input type="number" value={form.sellingPrice} onChange={e => update("sellingPrice", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Discount</label>
              <input type="number" value={form.mrp > form.sellingPrice ? form.mrp - form.sellingPrice : 0} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Stock Quantity *</label>
              <input type="number" value={form.stock} onChange={e => update("stock", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Low Stock Threshold</label>
              <input type="number" value={form.lowStockThreshold} onChange={e => update("lowStockThreshold", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Variants</h2>
            <button onClick={addVariant} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ Add Variant</button>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-gray-400">No variants added. This product will be a simple listing.</p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input placeholder="Name (e.g. Red, XL)" value={v.name} onChange={e => updateVariant(i, "name", e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <input placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" placeholder="Price" value={v.price} onChange={e => updateVariant(i, "price", Number(e.target.value))} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(i, "stock", Number(e.target.value))} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <button onClick={() => removeVariant(i)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg text-sm">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Shipping</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => update("weight", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Length (cm)</label>
              <input type="number" value={form.length} onChange={e => update("length", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Width (cm)</label>
              <input type="number" value={form.width} onChange={e => update("width", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Height (cm)</label>
              <input type="number" value={form.height} onChange={e => update("height", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
           <div className="md:col-span-3">
  <label className="block text-sm font-medium text-gray-600 mb-1">Warehouse Address</label>
  <input value={form.warehouseAddress} onChange={e => update("warehouseAddress", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Street, building, unit" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-600 mb-1">Warehouse City *</label>
  <input value={form.warehouseCity} onChange={e => update("warehouseCity", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-600 mb-1">Warehouse State *</label>
  <input value={form.warehouseState} onChange={e => update("warehouseState", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-600 mb-1">Warehouse Pincode *</label>
  <input value={form.warehousePincode} onChange={e => update("warehousePincode", e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
</div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Handling Time (days)</label>
              <input type="number" value={form.handlingTime} onChange={e => update("handlingTime", Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">SEO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Search Title</label>
              <input value={form.searchTitle} onChange={e => update("searchTitle", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => update("tags", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="tag1, tag2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Keywords (comma separated)</label>
              <input value={form.keywords} onChange={e => update("keywords", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="kw1, kw2" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => handleSubmit("draft")} disabled={loading} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Save as Draft
          </button>
          <button onClick={() => handleSubmit("active")} disabled={loading || !form.name || !form.category} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
