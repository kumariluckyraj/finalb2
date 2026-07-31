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
  bankCodes: string[] | null;
}

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537"
};

const AVAILABLE_BANKS = ["HDFC", "IDFC", "ICICI", "SBI", "AXIS", "Airtel Payments Bank"];

const emptyForm = {
  code: "", title: "", description: "", discountType: "percentage",
  discountValue: "", maxDiscount: "", minCartValue: "",
  usageLimit: "", perUserLimit: "1", startsAt: "", endsAt: "",
  bankCodes: [] as string[],
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.status === 401 || res.status === 403) {
        setPageError(res.status === 401 ? "You're not logged in." : "You don't have access to this page.");
        setCoupons([]);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setPageError("Failed to load coupons. Please try again.");
        setCoupons([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCoupons(data.coupons ?? []);
      setPageError(null);
    } catch (e) {
      console.error(e);
      setPageError("Failed to load coupons. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountValue: parseFloat(form.discountValue),
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
          minCartValue: form.minCartValue ? parseFloat(form.minCartValue) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
          perUserLimit: parseInt(form.perUserLimit),
          // datetime-local has no timezone info; convert to a real Date
          // in the browser's local timezone before sending, so the server
          // doesn't reinterpret the raw string in its own timezone.
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          bankCodes: form.bankCodes.length ? form.bankCodes : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFormError(data?.error ?? "Failed to create coupon. Please check the fields and try again.");
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      setForm(emptyForm);
      await fetchCoupons();
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) {
        setPageError("Failed to update coupon status.");
        return;
      }
      fetchCoupons();
    } catch (e) {
      console.error(e);
      setPageError("Failed to update coupon status.");
    }
  };

  const toggleBank = (bank: string) => {
    setForm(f => ({
      ...f,
      bankCodes: f.bankCodes.includes(bank)
        ? f.bankCodes.filter(b => b !== bank)
        : [...f.bankCodes, bank],
    }));
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
        .pd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
        .pd-label { display: block; margin-bottom: 8px; font-size: 13px; color: ${pd.graphite}; font-weight: 600; }
        .pd-bank-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24, flexWrap: "wrap", gap: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 64px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
            Coupons
          </h1>
          <button onClick={() => { setShowForm(!showForm); setFormError(null); }} className={showForm ? "pd-btn-outline" : "pd-btn"}>
            {showForm ? "Cancel" : "+ New Coupon"}
          </button>
        </div>

        {pageError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 4, marginBottom: 24, fontSize: 14 }}>
            {pageError}
          </div>
        )}

        {showForm && (
          <div style={{ background: pd.paperWhite, border: `1px solid ${pd.mist}`, padding: 32, marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 32px", fontWeight: 400 }}>
              Create New Coupon
            </h2>

            {formError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 4, marginBottom: 24, fontSize: 14 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                <div>
                  <label className="pd-label" htmlFor="code">Code</label>
                  <input id="code" className="pd-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                </div>
                <div>
                  <label className="pd-label" htmlFor="title">Title</label>
                  <input id="title" className="pd-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="pd-label" htmlFor="description">Description</label>
                  <input id="description" className="pd-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="pd-label" htmlFor="discountType">Discount Type</label>
                  <select id="discountType" className="pd-input" value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="pd-label" htmlFor="discountValue">Discount Value</label>
                  <input id="discountValue" className="pd-input" type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required />
                </div>
                <div>
                  <label className="pd-label" htmlFor="maxDiscount">Max Discount (cap, for % only)</label>
                  <input id="maxDiscount" className="pd-input" type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
                <div>
                  <label className="pd-label" htmlFor="minCartValue">Min Cart Value</label>
                  <input id="minCartValue" className="pd-input" type="number" value={form.minCartValue} onChange={e => setForm({ ...form, minCartValue: e.target.value })} />
                </div>
                <div>
                  <label className="pd-label" htmlFor="usageLimit">Usage Limit (Total)</label>
                  <input id="usageLimit" className="pd-input" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
                </div>
                <div>
                  <label className="pd-label" htmlFor="perUserLimit">Per-User Limit</label>
                  <input id="perUserLimit" className="pd-input" type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} />
                </div>
                <div>
                  <label className="pd-label" htmlFor="startsAt">Start Date</label>
                  <input id="startsAt" className="pd-input" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} required />
                </div>
                <div>
                  <label className="pd-label" htmlFor="endsAt">End Date</label>
                  <input id="endsAt" className="pd-input" type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="pd-label">Restrict to Banks (leave empty for all cards)</label>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {AVAILABLE_BANKS.map(bank => (
                      <label key={bank} className="pd-bank-label">
                        <input
                          type="checkbox"
                          checked={form.bankCodes.includes(bank)}
                          onChange={() => toggleBank(bank)}
                        />
                        {bank}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button type="submit" className="pd-btn" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Coupon"}
                </button>
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
                    {c.bankCodes?.length ? (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: pd.carbonInk, fontWeight: 600 }}>
                        {c.bankCodes.join(", ")} only
                      </p>
                    ) : (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: pd.graphite }}>All cards</p>
                    )}
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