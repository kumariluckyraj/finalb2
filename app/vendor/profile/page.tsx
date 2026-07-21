"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { router.push("/sell-online"); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { profile, store, bank, user } = data;

  const kycStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const sections = [
    {
      title: "Account",
      fields: [
        { label: "Name", value: user?.name },
        { label: "Email", value: user?.email },
      ],
    },
    {
      title: "Seller Profile",
      fields: [
        { label: "Business Name", value: profile?.businessName },
        { label: "Business Type", value: profile?.businessType },
        { label: "Phone", value: profile?.phone },
        { label: "Address", value: [profile?.addressLine1, profile?.addressLine2, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ") },
        { label: "GST/PAN", value: profile?.gstPan },
      ],
    },
    {
      title: "Store",
      fields: [
        { label: "Store Name", value: store?.storeName },
        { label: "URL Slug", value: store?.urlSlug },
        { label: "Category", value: store?.primaryCategory },
        { label: "Description", value: store?.description },
        { label: "COD", value: store?.codEnabled ? "Enabled" : "Disabled" },
        { label: "Delivery Promise", value: store?.deliveryPromiseDays ? `${store.deliveryPromiseDays} days` : null },
      ],
    },
    {
      title: "KYC & Tax",
      fields: [
        { label: "PAN Number", value: profile?.panNumber },
        { label: "GST Number", value: profile?.gstNumber },
        { label: "Verification Method", value: profile?.kycMethod === "digilocker" ? "Digilocker" : profile?.kycMethod === "manual" ? "Manual" : "Not submitted" },
        { label: "Status", value: profile?.kycStatus ? (
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${kycStatusColors[profile.kycStatus] || "bg-gray-100 text-gray-600"}`}>{profile.kycStatus}</span>
        ) : "—" },
      ],
    },
    {
      title: "Bank Account",
      fields: [
        { label: "Account Holder", value: bank?.accountHolderName },
        { label: "Account Number", value: bank?.accountNumber ? `XXXX${bank.accountNumber.slice(-4)}` : null },
        { label: "IFSC Code", value: bank?.ifscCode },
        { label: "Bank Name", value: bank?.bankName },
        { label: "Account Type", value: bank?.accountType },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Seller Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your seller account details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{section.title}</h2>
            <dl className="space-y-3">
              {section.fields.map(f => f.value ? (
                <div key={f.label}>
                  <dt className="text-xs text-gray-400">{f.label}</dt>
                  <dd className="text-sm text-gray-800 font-medium mt-0.5">{f.value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
