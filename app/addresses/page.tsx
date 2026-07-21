"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", emberRed: "#cc2e39",
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Other"
];

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    id: "", full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", is_default: false
  });
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    fetch("/api/addresses").then(res => res.json())
      .then((addressData) => {
        setAddresses(addressData.addresses || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({ id: "", full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", is_default: false });
    setShowAddressForm(true);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      id: addr.id, full_name: addr.full_name, phone: addr.phone,
      address_line1: addr.address_line1, address_line2: addr.address_line2 || "",
      city: addr.city, state: addr.state, pincode: addr.pincode, is_default: addr.is_default
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await fetch("/api/addresses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (e) { alert("Failed to delete address"); }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      const method = editingAddressId ? "PUT" : "POST";
      const res = await fetch("/api/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (editingAddressId) {
        setAddresses(addresses.map(a => a.id === data.address.id ? data.address : (data.address.is_default ? { ...a, is_default: false } : a)));
      } else {
        setAddresses([data.address, ...addresses.map(a => data.address.is_default ? { ...a, is_default: false } : a)]);
      }
      setShowAddressForm(false);
    } catch (err: any) { alert(err.message); } 
    finally { setAddressLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${pd.carbonInk}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, fontFamily: "var(--font-geist, 'Inter', sans-serif)", color: pd.carbonInk }}>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pd-input { 
          width: 100%; box-sizing: border-box; border: 1px solid ${pd.ashBorder}; 
          border-radius: 4px; padding: 12px 16px; font-size: 14px; 
          color: ${pd.carbonInk}; outline: none; font-family: inherit; background: ${pd.fog};
          transition: border-color 0.2s;
        }
        .pd-input:focus { border-color: ${pd.carbonInk}; }
        .pd-btn {
          background: ${pd.carbonInk}; color: ${pd.paperWhite}; border: none;
          padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: opacity 0.2s;
        }
        .pd-btn:hover { opacity: 0.85; }
        .pd-btn-outline {
          background: transparent; color: ${pd.carbonInk}; border: 1px solid ${pd.carbonInk};
          padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: background 0.2s;
        }
        .pd-btn-outline:hover { background: ${pd.fog}; }
        .pd-btn-ghost {
          background: transparent; color: ${pd.carbonInk}; border: none;
          padding: 0; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: opacity 0.2s;
        }
        .pd-btn-ghost:hover { opacity: 0.7; }
        .pd-address-card {
          border: 1px solid ${pd.mist}; padding: 24px; background: ${pd.paperWhite};
          display: flex; flex-direction: column; gap: 16px; transition: background 0.2s;
        }
        .pd-address-card:hover { background: ${pd.fog}; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px" }}>
        
        {/* Breadcrumb / Back */}
        <div style={{ marginBottom: 48 }}>
          <button onClick={() => router.push("/settings")} className="pd-btn-ghost" style={{ textTransform: "none", fontSize: 13, letterSpacing: "normal", display: "inline-flex", alignItems: "center", gap: 8, color: pd.graphite }}>
            ← Back to Account Settings
          </button>
        </div>

        <div style={{ marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
            Saved Addresses
          </h1>
          <p style={{ margin: "16px 0 0", color: pd.graphite, fontSize: 16 }}>
            Manage your delivery locations.
          </p>
        </div>

        <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: 0, fontWeight: 400 }}>
              Your Addresses
            </h2>
            {!showAddressForm && (
              <button className="pd-btn-outline" onClick={openNewAddress}>
                + Add New
              </button>
            )}
          </div>

          {showAddressForm && (
            <div style={{ border: `1px solid ${pd.mist}`, padding: 32, marginBottom: 48, background: pd.paperWhite }}>
              <h3 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 24, margin: "0 0 24px", fontWeight: 400 }}>
                {editingAddressId ? "Edit Address" : "New Address"}
              </h3>
              <form onSubmit={handleSaveAddress} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Full Name</label>
                  <input className="pd-input" required value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Phone Number</label>
                  <input className="pd-input" required value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Address Line 1</label>
                  <input className="pd-input" required value={addressForm.address_line1} onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Address Line 2 (Optional)</label>
                  <input className="pd-input" value={addressForm.address_line2} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>City</label>
                  <input className="pd-input" required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>State</label>
                  <select className="pd-input" required value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Pincode</label>
                  <input className="pd-input" required value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, gridColumn: "1 / -1" }}>
                  <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} style={{ width: 16, height: 16, accentColor: pd.carbonInk }} />
                  <label htmlFor="is_default" style={{ fontSize: 14, color: pd.carbonInk }}>Set as default address</label>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16, marginTop: 8 }}>
                  <button type="submit" className="pd-btn" disabled={addressLoading}>
                    {addressLoading ? "Saving..." : "Save Address"}
                  </button>
                  <button type="button" className="pd-btn-ghost" onClick={() => setShowAddressForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showAddressForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {addresses.length === 0 ? (
                <p style={{ fontSize: 16, color: pd.graphite }}>No saved addresses found.</p>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} className="pd-address-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: pd.carbonInk, display: "flex", alignItems: "center", gap: 12 }}>
                          {addr.full_name}
                          {addr.is_default && (
                            <span style={{ padding: "2px 8px", background: pd.mist, borderRadius: 9999, fontSize: 10, fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", fontWeight: 700 }}>
                              Default
                            </span>
                          )}
                        </p>
                        <p style={{ margin: "0 0 16px", fontSize: 14, color: pd.graphite }}>{addr.phone}</p>
                        
                        <p style={{ margin: "0 0 4px", fontSize: 14, color: pd.carbonInk, lineHeight: 1.5 }}>
                          {addr.address_line1}
                          {addr.address_line2 && <><br />{addr.address_line2}</>}
                        </p>
                        <p style={{ margin: 0, fontSize: 14, color: pd.carbonInk }}>
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                      <button onClick={() => openEditAddress(addr)} className="pd-btn-ghost">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="pd-btn-ghost" style={{ color: pd.emberRed }}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
