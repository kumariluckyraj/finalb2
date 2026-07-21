"use client";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minCartValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", title: "", description: "", discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0, minCartValue: "", maxDiscount: "", usageLimit: "", perUserLimit: 1,
    startsAt: "", endsAt: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/seller/coupons")
      .then(r => r.json())
      .then(d => { setCoupons(d.coupons || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createCoupon = async () => {
    const body = {
      code: form.code,
      title: form.title,
      description: form.description,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minCartValue: form.minCartValue ? Number(form.minCartValue) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: form.perUserLimit,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    const res = await fetch("/api/seller/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({ code: "", title: "", description: "", discountType: "percentage", discountValue: 0, minCartValue: "", maxDiscount: "", usageLimit: "", perUserLimit: 1, startsAt: "", endsAt: "" });
      load();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to create coupon");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
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
        <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          {showForm ? "Cancel" : "+ New Coupon"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Create Coupon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Discount Type *</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as "percentage" | "fixed" }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Discount Value *</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Cart Value</label>
              <input type="number" value={form.minCartValue} onChange={e => setForm(f => ({ ...f, minCartValue: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Discount</label>
              <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date *</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date *</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Per User Limit</label>
              <input type="number" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createCoupon} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Create Coupon</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">Code</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Title</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Discount</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Usage</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Valid Until</th>
              <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-gray-800">{c.code}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.title}</p>
                  {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  {c.maxDiscount && <span className="text-xs text-gray-400 ml-1">(max ₹{c.maxDiscount})</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""} <span className="text-xs">(×{c.perUserLimit}/user)</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(c.endsAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c.id, c.isActive)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border-none ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No coupons yet. Create your first one!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
