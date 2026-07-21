"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Business Info", "Address & Bank", "Store Setup"];
const BUSINESS_TYPES = ["individual", "company", "brand"];
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi",
];

export default function SellerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "", businessType: "individual", phone: "", gstPan: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
    accountHolderName: "", accountNumber: "", confirmAccountNumber: "", ifscCode: "", bankName: "", accountType: "savings",
    storeName: "", urlSlug: "", description: "", shippingPolicy: "", returnPolicy: "", primaryCategory: "", subcategories: "",
  });

  useEffect(() => {
    fetch("/api/seller/onboarding")
      .then(r => r.json())
      .then(d => {
        if (d.onboardingCompleted) { router.push("/vendor/dashboard"); return; }
        setStep(d.onboardingStep || 0);
        if (d.profile) {
          setForm(prev => ({
            ...prev,
            businessName: d.profile.businessName || "",
            businessType: d.profile.businessType || "individual",
            phone: d.profile.phone || "",
            gstPan: d.profile.gstPan || "",
            addressLine1: d.profile.addressLine1 || "",
            addressLine2: d.profile.addressLine2 || "",
            city: d.profile.city || "",
            state: d.profile.state || "",
            pincode: d.profile.pincode || "",
          }));
        }
        if (d.bank) {
          setForm(prev => ({
            ...prev,
            accountHolderName: d.bank.accountHolderName || "",
            accountNumber: d.bank.accountNumber || "",
            confirmAccountNumber: d.bank.confirmAccountNumber || "",
            ifscCode: d.bank.ifscCode || "",
            bankName: d.bank.bankName || "",
            accountType: d.bank.accountType || "savings",
          }));
        }
        if (d.store) {
          setForm(prev => ({
            ...prev,
            storeName: d.store.storeName || "",
            urlSlug: d.store.urlSlug || "",
            description: d.store.description || "",
            shippingPolicy: d.store.shippingPolicy || "",
            returnPolicy: d.store.returnPolicy || "",
            primaryCategory: d.store.primaryCategory || "",
          }));
        }
        setInitialLoading(false);
      })
      .catch(() => { setInitialLoading(false); router.push("/login"); });
  }, []);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const saveStep = async (s: number, isLast = false) => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/seller/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, step: s }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
    if (isLast) { router.push("/vendor/dashboard"); return; }
    setStep(s + 1);
    setLoading(false);
  };

  const canContinue = () => {
    if (step === 0) return form.businessName && form.phone;
    if (step === 1) return form.addressLine1 && form.city && form.state && form.pincode && form.accountHolderName && form.accountNumber && form.ifscCode;
    if (step === 2) return form.storeName && form.urlSlug;
    return true;
  };

  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Become a Seller</h1>
          <p className="text-gray-400 text-sm mt-1">Set up your seller account to start selling</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-brand-blue text-white" : "bg-gray-200 text-gray-400"}`}>
                {i < step ? "Done" : i + 1}
              </div>
              <span className={`text-sm hidden md:inline ${i <= step ? "text-gray-800 font-medium" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-brand-blue" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Business Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Business Name *</label>
                <input value={form.businessName} onChange={e => update("businessName", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Your business name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Business Type *</label>
                <div className="flex gap-3">
                  {BUSINESS_TYPES.map(t => (
                    <button key={t} onClick={() => update("businessType", t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${form.businessType === t ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone *</label>
                <input value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">GST/PAN (Tax ID)</label>
                <input value={form.gstPan} onChange={e => update("gstPan", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Optional" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Address & Bank Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Address Line 1 *</label>
                  <input value={form.addressLine1} onChange={e => update("addressLine1", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Address Line 2</label>
                  <input value={form.addressLine2} onChange={e => update("addressLine2", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">City *</label>
                  <input value={form.city} onChange={e => update("city", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">State *</label>
                  <select value={form.state} onChange={e => update("state", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Pincode *</label>
                  <input value={form.pincode} onChange={e => update("pincode", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
              </div>
              <hr className="my-4" />
              <h3 className="font-semibold text-gray-700">Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Holder Name *</label>
                  <input value={form.accountHolderName} onChange={e => update("accountHolderName", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Number *</label>
                  <input value={form.accountNumber} onChange={e => update("accountNumber", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Account Number *</label>
                  <input value={form.confirmAccountNumber} onChange={e => update("confirmAccountNumber", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">IFSC Code *</label>
                  <input value={form.ifscCode} onChange={e => update("ifscCode", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="e.g. SBIN0001234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                  <input value={form.bankName} onChange={e => update("bankName", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Store Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Store Name *</label>
                  <input value={form.storeName} onChange={e => { update("storeName", e.target.value); update("urlSlug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">URL Slug *</label>
                  <input value={form.urlSlug} onChange={e => update("urlSlug", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="my-store" />
                  <p className="text-xs text-gray-400 mt-1">b2world.com/store/{form.urlSlug || "my-store"}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Describe your store..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Primary Category</label>
                  <select value={form.primaryCategory} onChange={e => update("primaryCategory", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white">
                    <option value="">Select category</option>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Shipping Policy</label>
                  <textarea value={form.shippingPolicy} onChange={e => update("shippingPolicy", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="e.g. Free shipping for orders above ₹499" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Return Policy</label>
                  <textarea value={form.returnPolicy} onChange={e => update("returnPolicy", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="e.g. 7-day return policy" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : router.push("/sell-online")}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => saveStep(step, step === STEPS.length - 1)}
              disabled={!canContinue() || loading}
              className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {step === STEPS.length - 1 ? "Complete Setup" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
