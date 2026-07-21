"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const STEPS = ["Account Creation", "Business Details", "Bank Details", "Store Setup"];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

type FileField = "aadhaarCard" | "gstCertificate" | "panCard" | "storeLogo" | "storeBanner";

export default function VendorSignup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Step 1
    name: "", email: "", mobile: "", password: "", confirmPassword: "", agreed: false,
    // Step 2
    gstNumber: "", panNumber: "",
    // Step 3
    accountHolderName: "", accountNumber: "", ifscCode: "",
    // Step 4
    storeName: "", storeDescription: "", productCategory: "",
    addressLine1: "", addressLine2: "", city: "", state: "", pincode: "",
  });

  const [files, setFiles] = useState<Record<FileField, File | null>>({
    aadhaarCard: null, gstCertificate: null, panCard: null,
    storeLogo: null, storeBanner: null,
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  const setFile = (k: FileField, f: File | null) => setFiles((p) => ({ ...p, [k]: f }));

  const inputCls = "w-full text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-gray-50";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  const FileUploadBox = ({ field, label }: { field: FileField; label: string }) => (
    <div>
      <label className={labelCls}>{label} <span className="text-red-500">*</span></label>
      <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-brand-blue hover:bg-blue-50 transition bg-gray-50">
        <span className="text-brand-blue text-sm font-bold">Upload</span>
        <span className="text-sm text-gray-500">{files[field]?.name || `Upload ${label}`}</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => setFile(field, e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      const res = await fetch("/api/vendor/register", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      setDone(true);
    } catch (err) {
      console.error("Vendor registration failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function validateStep(): string {
    if (step === 0) {
      if (!form.name || !form.email || !form.mobile || !form.password || !form.confirmPassword)
        return "Please fill all required fields.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      if (!form.agreed) return "Please agree to Terms & Conditions.";
    }
    if (step === 1) {
      if (!form.gstNumber || !form.panNumber) return "Please fill all required fields.";
      if (!files.aadhaarCard || !files.gstCertificate || !files.panCard) return "Please upload all required documents.";
    }
    if (step === 2) {
      if (!form.accountHolderName || !form.accountNumber || !form.ifscCode) return "Please fill all required fields.";
    }
    if (step === 3) {
      if (!form.storeName || !form.productCategory || !form.addressLine1 || !form.city || !form.state || !form.pincode)
        return "Please fill all required fields.";
    }
    return "";
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    if (step === 3) { handleSubmit(); return; }
    setStep((s) => s + 1);
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
      <div className="mb-8">
        <span className="text-2xl font-bold text-gray-800">B2World <span className="text-brand-blue">Shopping</span></span>
      </div>
      <Stepper current={4} />
      <div className="mt-12 bg-white rounded-2xl shadow p-10 max-w-lg w-full text-center border border-blue-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600 w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Your account has been created!</h2>
        <p className="text-gray-600 mb-1">Thank you for registering as a seller with B2World <span className="text-brand-blue font-semibold">Shopping</span>.</p>
        <p className="text-gray-500 text-sm mb-6">Our team will review your documents and notify you once your account is approved. After approval, you'll be able to start selling.</p>
        <button onClick={() => router.push("/")} className="bg-brand-blue text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-blue transition">
          Go to Home Page
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4 pb-16">
      <div className="mb-8">
        <span className="text-2xl font-bold text-gray-800">B2World <span className="text-brand-blue">Shopping</span></span>
      </div>
      <Stepper current={step} />

      <div className="mt-10 bg-white rounded-2xl shadow-md p-8 w-full max-w-lg border border-gray-100">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 border border-red-200">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="John Doe" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
              <input className={inputCls} type="email" placeholder="example@gmail.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Mobile Number <span className="text-red-500">*</span></label>
              <input className={inputCls} type="tel" placeholder="+91 98765 43210" value={form.mobile} onChange={e => set("mobile", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Password <span className="text-red-500">*</span></label>
              <input className={inputCls} type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
              <input className={inputCls} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agreed} onChange={e => set("agreed", e.target.checked)} className="accent-brand-blue w-4 h-4" />
              <span className="text-sm text-gray-600">I agree to the <span className="text-brand-blue font-medium hover:underline cursor-pointer">Terms & Conditions</span></span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>GST Number <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>PAN Number <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="ABCDE1234F" value={form.panNumber} onChange={e => set("panNumber", e.target.value)} />
              </div>
            </div>
            <FileUploadBox field="aadhaarCard" label="Aadhaar Card Upload" />
            <FileUploadBox field="gstCertificate" label="GST Certificate Upload" />
            <FileUploadBox field="panCard" label="PAN Card Upload" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Account Holder Name <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="John Doe" value={form.accountHolderName} onChange={e => set("accountHolderName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Account Number <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="1234567890" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>IFSC Code <span className="text-red-500">*</span></label>
              <input className={inputCls} placeholder="SBIN0001234" value={form.ifscCode} onChange={e => set("ifscCode", e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="font-semibold text-gray-700">Store Information</p>
            <input className={inputCls} placeholder="Store Name *" value={form.storeName} onChange={e => set("storeName", e.target.value)} />
            <textarea className={inputCls + " resize-none h-24"} placeholder="Store Description (optional)" value={form.storeDescription} onChange={e => set("storeDescription", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Store Logo (optional)</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 cursor-pointer hover:border-brand-blue bg-gray-50">
                  <span className="text-xs text-gray-500">{files.storeLogo?.name || "Upload Logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFile("storeLogo", e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className={labelCls}>Store Banner (optional)</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 cursor-pointer hover:border-brand-blue bg-gray-50">
                  <span className="text-xs text-gray-500">{files.storeBanner?.name || "Upload Banner"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFile("storeBanner", e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
            <input className={inputCls} placeholder="Product Category (e.g. Fashion, Electronics) *" value={form.productCategory} onChange={e => set("productCategory", e.target.value)} />
            <p className="font-semibold text-gray-700 pt-2">Pickup Address</p>
            <input className={inputCls} placeholder="Address Line 1 (House No., Street) *" value={form.addressLine1} onChange={e => set("addressLine1", e.target.value)} />
            <input className={inputCls} placeholder="Address Line 2 (Area, Colony, Landmark)" value={form.addressLine2} onChange={e => set("addressLine2", e.target.value)} />
            <input className={inputCls} placeholder="City *" value={form.city} onChange={e => set("city", e.target.value)} />
            <select className={inputCls} value={form.state} onChange={e => set("state", e.target.value)}>
              <option value="">Select State *</option>
              {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input className={inputCls} placeholder="Pincode *" value={form.pincode} onChange={e => set("pincode", e.target.value)} />
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => { setStep(s => s - 1); setError(""); }} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
              Back
            </button>
          )}
          <button onClick={next} disabled={loading} className="flex-1 bg-brand-blue text-white py-3 rounded-xl font-semibold hover:bg-brand-blue transition disabled:opacity-60">
            {loading ? "Submitting..." : step === 3 ? "Save & Finish" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center w-full max-w-2xl">
      {STEPS.map((label, i) => {
        const completed = current > i;
        const active = current === i;
        return (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div className={`absolute left-0 top-4 w-full h-0.5 -translate-y-1/2 ${completed || active ? "bg-green-500" : "bg-gray-200"}`} style={{ left: "-50%", width: "100%" }} />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all
              ${completed ? "bg-green-500 border-green-500 text-white"
              : active ? "bg-white border-brand-blue text-brand-blue"
              : "bg-white border-gray-300 text-gray-400"}`}>
              {completed ? "Done" : i + 1}
            </div>
            <span className={`text-xs mt-1.5 font-medium ${active ? "text-brand-blue" : completed ? "text-green-600" : "text-gray-400"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}