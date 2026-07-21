"use client";
import { useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  isReimbursed: boolean;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537"
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", title: "", description: "", discountType: "percentage",
    discountValue: "", maxDiscount: "", minCartValue: "",
    usageLimit: "", perUserLimit: "1", startsAt: "", endsAt: "",
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        minCartValue: form.minCartValue ? parseFloat(form.minCartValue) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        perUserLimit: parseInt(form.perUserLimit),
      }),
    });
    setShowForm(false);
    setForm({ code: "", title: "", description: "", discountType: "percentage", discountValue: "", maxDiscount: "", minCartValue: "", usageLimit: "", perUserLimit: "1", startsAt: "", endsAt: "" });
    fetchCoupons();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchCoupons();
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
        .pd-table { width: 100%; border-collapse: collapse; }
        .pd-th { 
          text-align: left; padding: 16px; border-bottom: 1px solid ${pd.carbonInk};
          font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; color: ${pd.graphite}; font-size: 14px;
        }
        .pd-td { padding: 16px; border-bottom: 1px solid ${pd.mist}; vertical-align: top; }
        .pd-tr:hover .pd-td { background: ${pd.fog}; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24, flexWrap: "wrap", gap: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 64px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
            Coupons
          </h1>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? "pd-btn-outline" : "pd-btn"}>
            {showForm ? "Cancel" : "+ New Coupon"}
          </button>
        </div>

        {showForm && (
          <div style={{ background: pd.paperWhite, border: `1px solid ${pd.mist}`, padding: 32, marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 32px", fontWeight: 400 }}>
              Create New Coupon
            </h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Code</label>
                  <input className="pd-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Title</label>
                  <input className="pd-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Description</label>
                  <input className="pd-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Discount Type</label>
                  <select className="pd-input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Discount Value</label>
                  <input className="pd-input" type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Max Discount (cap, for % only)</label>
                  <input className="pd-input" type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Min Cart Value</label>
                  <input className="pd-input" type="number" value={form.minCartValue} onChange={e => setForm({ ...form, minCartValue: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Usage Limit (Total)</label>
                  <input className="pd-input" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Per-User Limit</label>
                  <input className="pd-input" type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Start Date (ISO)</label>
                  <input className="pd-input" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>End Date (ISO)</label>
                  <input className="pd-input" type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} required />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button type="submit" className="pd-btn">Create Coupon</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="pd-table">
            <thead>
              <tr>
                <th className="pd-th">Code / Title</th>
                <th className="pd-th">Discount</th>
                <th className="pd-th">Usage</th>
                <th className="pd-th">Validity</th>
                <th className="pd-th" style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="pd-tr">
                  <td className="pd-td">
                    <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 16, color: pd.carbonInk }}>{c.code}</p>
                    <p style={{ margin: 0, fontSize: 14, color: pd.graphite }}>{c.title}</p>
                  </td>
                  <td className="pd-td">
                    <p style={{ margin: "0 0 4px", fontSize: 16, color: pd.carbonInk }}>
                      {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </p>
                    {c.maxDiscount && <p style={{ margin: 0, fontSize: 12, color: pd.graphite }}>Up to ₹{c.maxDiscount}</p>}
                  </td>
                  <td className="pd-td">
                    <p style={{ margin: 0, fontSize: 14, color: pd.carbonInk, fontFamily: "var(--font-geist-mono, monospace)" }}>
                      {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : "/ ∞"}
                    </p>
                  </td>
                  <td className="pd-td">
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: pd.graphite }}>Starts: {new Date(c.startsAt).toLocaleDateString()}</p>
                    <p style={{ margin: 0, fontSize: 13, color: pd.graphite }}>Ends: {new Date(c.endsAt).toLocaleDateString()}</p>
                  </td>
                  <td className="pd-td" style={{ textAlign: "right" }}>
                    <button onClick={() => toggleActive(c.id, c.isActive)}
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)",
                        textTransform: "uppercase", letterSpacing: "0.038em", fontSize: 13,
                        fontWeight: 700, color: c.isActive ? "#10b981" : pd.graphite,
                        textDecoration: "underline"
                      }}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="pd-td" style={{ textAlign: "center", padding: 48, color: pd.graphite }}>
                    No coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
