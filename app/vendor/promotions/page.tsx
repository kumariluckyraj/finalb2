"use client";
import { useEffect, useState } from "react";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "discount_code", title: "", description: "", code: "",
    discountType: "percentage", discountValue: 0, minOrderValue: 0,
    maxDiscountAmount: 0, perUserLimit: 1, applicableCategories: "",
    applicableProducts: "", startsAt: "", endsAt: "", usageLimit: 0,
  });

  const load = () => {
    Promise.all([
      fetch("/api/seller/promotions").then(r => r.json()),
      fetch("/api/seller/promotions/analytics").then(r => r.json()),
    ]).then(([d, a]) => { setPromotions(d.promotions || []); setAnalytics(a); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (id: string, isActive: boolean) => {
    await fetch("/api/seller/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    load();
  };

  const createPromo = async () => {
    const catArr = form.applicableCategories ? form.applicableCategories.split(",").map(s => s.trim()).filter(Boolean) : [];
    const prodArr = form.applicableProducts ? form.applicableProducts.split(",").map(s => s.trim()).filter(Boolean) : [];
    await fetch("/api/seller/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        applicableCategories: catArr,
        applicableProducts: prodArr,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    });
    setShowForm(false);
    setForm({ type: "discount_code", title: "", description: "", code: "", discountType: "percentage", discountValue: 0, minOrderValue: 0, maxDiscountAmount: 0, perUserLimit: 1, applicableCategories: "", applicableProducts: "", startsAt: "", endsAt: "", usageLimit: 0 });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promotions</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition cursor-pointer border-none">
          {showForm ? "Cancel" : "+ New Promotion"}
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-xs text-indigo-600 mb-1">Total Promotions</p>
            <p className="text-2xl font-bold text-indigo-700">{analytics.totalPromotions}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-green-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-700">{analytics.activeCount}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 mb-1">Total Usage</p>
            <p className="text-2xl font-bold text-blue-700">{analytics.totalUsage}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-600 mb-1">Top Promo</p>
            <p className="text-lg font-bold text-purple-700 truncate">{analytics.topPerforming?.[0]?.title || "—"}</p>
          </div>
          {/* By type breakdown */}
          {analytics.byType?.map((t: any) => (
            <div key={t.type} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 capitalize">{t.type.replace("_", " ")}</span>
              <span className="text-sm font-bold text-gray-700">{t.count} ({t.usage} uses)</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Create Promotion</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                <option value="discount_code">Discount Code</option>
                <option value="bundle_offer">Bundle Offer</option>
                <option value="platform_sale">Platform Sale</option>
                <option value="featured_listing">Featured Listing</option>
                <option value="promoted_product">Promoted Product</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            {form.type === "discount_code" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Code <span className="text-red-400">*</span></label>
                  <input value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase" placeholder="SUMMER20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Discount Type</label>
                  <select value={form.discountType} onChange={e => setForm(prev => ({ ...prev, discountType: e.target.value as any }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Discount Value</label>
                  <input type="number" value={form.discountValue} onChange={e => setForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Min Order Value</label>
                  <input type="number" value={form.minOrderValue} onChange={e => setForm(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Max Discount</label>
                  <input type="number" value={form.maxDiscountAmount} onChange={e => setForm(prev => ({ ...prev, maxDiscountAmount: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Per-User Limit</label>
                  <input type="number" value={form.perUserLimit} onChange={e => setForm(prev => ({ ...prev, perUserLimit: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Applicable Categories (comma-separated)</label>
              <input value={form.applicableCategories} onChange={e => setForm(prev => ({ ...prev, applicableCategories: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="fashion, electronics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Applicable Product IDs (comma-separated)</label>
              <input value={form.applicableProducts} onChange={e => setForm(prev => ({ ...prev, applicableProducts: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="prod-1, prod-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => setForm(prev => ({ ...prev, startsAt: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => setForm(prev => ({ ...prev, endsAt: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(prev => ({ ...prev, usageLimit: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
          <button onClick={createPromo} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition cursor-pointer border-none">Create</button>
        </div>
      )}

      {promotions.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No promotions created yet</div>
      ) : (
        <div className="space-y-3">
          {promotions.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{p.title}</span>
                  {p.code && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{p.code}</span>}
                  <span className="px-1.5 py-0.5 bg-blue-100 text-brand-blue rounded text-xs">{p.type.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {p.discountType === "percentage" ? `${p.discountValue}%` : `₹${p.discountValue}`} off
                  · Used {p.usageCount} time(s)
                  {p.perUserLimit > 1 && ` · ${p.perUserLimit}x per user`}
                  {p.applicableCategories?.length > 0 && ` · Categories: ${p.applicableCategories.join(", ")}`}
                </p>
                <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                  <span>{new Date(p.startsAt).toLocaleDateString()} — {new Date(p.endsAt).toLocaleDateString()}</span>
                  {p.usageLimit > 0 && <span>Limit: {p.usageCount}/{p.usageLimit}</span>}
                </div>
              </div>
              <button onClick={() => toggleStatus(p.id, p.isActive)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none ${p.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {p.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
