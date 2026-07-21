"use client";
import { useEffect, useState } from "react";

interface Vendor {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  storeName: string;
  storeDescription: string;
  gstNumber: string;
  panNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  productCategory: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  aadhaarCardUrl: string;
  gstCertificateUrl: string;
  panCardUrl: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDot = {
  pending: "bg-yellow-400",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const DocLink = ({ label, url }: { label: string; url: string }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-400">DOC</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    
   {url ? (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 text-xs font-semibold text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
  >
    View ↗
  </a>
) : (
      <span className="text-xs text-red-400 bg-red-50 px-3 py-1.5 rounded-lg">Not uploaded</span>
    )}
  </div>
);

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchVendors = async () => {
    const res = await fetch("/api/admin/vendors");
    const data = await res.json();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject" | "pending") => {
    setActionLoading(true);
    await fetch(`/api/admin/vendors/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await fetchVendors();
    setActionLoading(false);
    setSelected(null);
  };

  const filtered = filter === "all" ? vendors : vendors.filter(v => v.status === filter);
  const counts = {
    all: vendors.length,
    pending: vendors.filter(v => v.status === "pending").length,
    approved: vendors.filter(v => v.status === "approved").length,
    rejected: vendors.filter(v => v.status === "rejected").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Vendors</h1>
        <p className="text-sm text-b2w-muted mt-0.5">Review, verify documents, and approve vendor registrations</p>
      </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize flex items-center gap-2
                ${filter === f ? "bg-brand-blue text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-brand-blue"}`}
            >
              {f}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading applications...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400">No {filter === "all" ? "" : filter} applications found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-5 py-4 text-gray-500 font-medium">Vendor</th>
                  <th className="px-5 py-4 text-gray-500 font-medium">Store</th>
                  <th className="px-5 py-4 text-gray-500 font-medium hidden md:table-cell">Category</th>
                  <th className="px-5 py-4 text-gray-500 font-medium hidden md:table-cell">Applied</th>
                  <th className="px-5 py-4 text-gray-500 font-medium">Status</th>
                  <th className="px-5 py-4 text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v._id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">{v.name}</p>
                      <p className="text-gray-400 text-xs">{v.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{v.storeName}</td>
                    <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{v.productCategory}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs hidden md:table-cell">
                      {new Date(v.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[v.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[v.status]}`} />
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(v)}
                        className="text-brand-blue font-semibold hover:underline text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selected.name}</h2>
                <p className="text-xs text-gray-400">{selected.email} | {selected.mobile}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition text-lg">
                X
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Business Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Business Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ["GST Number", selected.gstNumber],
                    ["PAN Number", selected.panNumber],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-mono font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bank Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bank Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ["Account Holder", selected.accountHolderName],
                    ["Account Number", selected.accountNumber],
                    ["IFSC Code", selected.ifscCode],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-mono font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Store Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Store Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ["Store Name", selected.storeName],
                    ["Category", selected.productCategory],
                    ["City", selected.city],
                    ["State", selected.state],
                    ["Pincode", selected.pincode],
                    ["Address", `${selected.addressLine1}${selected.addressLine2 ? ", " + selected.addressLine2 : ""}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 shrink-0">{k}</span>
                      <span className="font-semibold text-gray-800 text-right">{v}</span>
                    </div>
                  ))}
                  {selected.storeDescription && (
                    <div className="pt-2 text-sm">
                      <p className="text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{selected.storeDescription}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* KYC Documents */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">KYC Documents</h3>
                <div className="bg-gray-50 rounded-xl px-4 divide-y divide-gray-100">
                  <DocLink label="Aadhaar Card" url={selected.aadhaarCardUrl} />
                  <DocLink label="GST Certificate" url={selected.gstCertificateUrl} />
                  <DocLink label="PAN Card" url={selected.panCardUrl} />
                </div>
              </section>

              {/* Store Assets */}
              {(selected.storeLogoUrl || selected.storeBannerUrl) && (
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Store Assets</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.storeLogoUrl && (
                      <a href={selected.storeLogoUrl} target="_blank" rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-gray-200 hover:border-brand-blue transition group">
                        <img src={selected.storeLogoUrl} alt="Store Logo" className="w-full h-24 object-cover group-hover:opacity-90 transition" />
                        <p className="text-xs text-center text-gray-500 py-2">Store Logo ↗</p>
                      </a>
                    )}
                    {selected.storeBannerUrl && (
                      <a href={selected.storeBannerUrl} target="_blank" rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-gray-200 hover:border-brand-blue transition group">
                        <img src={selected.storeBannerUrl} alt="Store Banner" className="w-full h-24 object-cover group-hover:opacity-90 transition" />
                        <p className="text-xs text-center text-gray-500 py-2">Store Banner ↗</p>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              {selected.status === "pending" ? (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleAction(selected._id, "approve")}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : ""} Approve
                  </button>
                  <button
                    onClick={() => handleAction(selected._id, "reject")}
                    disabled={actionLoading}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : ""} Reject
                  </button>
                </div>
              ) : (
               <div className="space-y-3">
    <div className={`text-center py-3 rounded-xl font-semibold text-sm capitalize ${statusColors[selected.status]}`}>
      This application has been {selected.status}
    </div>
    {/* Note: Add this */}
    <button
      onClick={() => handleAction(selected._id, "pending")}
      disabled={actionLoading}
      className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
    >
      ↩ Undo - Move back to Pending
    </button>
  </div>
                
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}