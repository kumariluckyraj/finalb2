"use client";
import { useEffect, useState } from "react";

export default function SellerSettingsPage() {
  const [store, setStore] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [codEnabled, setCodEnabled] = useState(true);
  const [deliveryPromiseDays, setDeliveryPromiseDays] = useState(5);
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/seller/settings")
      .then(r => r.json())
      .then(d => {
        setStore(d.store);
        setProfile(d.profile);
        if (d.store) {
          setCodEnabled(d.store.codEnabled ?? true);
          setDeliveryPromiseDays(d.store.deliveryPromiseDays ?? 5);
          setDeliveryCharge(d.store.deliveryCharge ?? 40);
          setFreeShippingThreshold(d.store.freeShippingThreshold ? String(d.store.freeShippingThreshold) : "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/seller/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: {
          codEnabled,
          deliveryPromiseDays,
          deliveryCharge,
          freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : null,
        },
      }),
    });
    setSaving(false);
    alert("Settings saved!");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Delivery & Shipping Config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Delivery & Shipping Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={codEnabled} onChange={e => setCodEnabled(e.target.checked)} className="accent-brand-blue w-5 h-5" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Enable COD</p>
              <p className="text-xs text-gray-400">Allow customers to pay with Cash on Delivery</p>
            </div>
          </label>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Delivery Promise (days)</label>
            <input
              type="number"
              value={deliveryPromiseDays}
              onChange={e => setDeliveryPromiseDays(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Estimated delivery time shown to customers</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Delivery Charge (₹)</label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={e => setDeliveryCharge(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              value={freeShippingThreshold}
              onChange={e => setFreeShippingThreshold(e.target.value)}
              placeholder="Leave empty to disable"
              min={0}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Orders above this amount get free delivery</p>
          </div>
        </div>
      </div>

      {/* KYC Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">KYC & Tax Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">GST / PAN</label>
            <p className="text-sm font-medium text-gray-800">{profile?.gstPan || "Not provided"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {profile?.gstPan
                ? "Your GST/PAN details are registered. Update via profile page."
                : "Add your GST/PAN details in your seller profile for tax compliance."}
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Verification Status</label>
            <p className={`text-sm font-medium ${profile?.gstPan ? "text-green-600" : "text-yellow-600"}`}>
              {profile?.gstPan ? "Document submitted" : "Pending"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Quick verification with Digilocker coming soon. Manual verification takes 24-48 hours.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
