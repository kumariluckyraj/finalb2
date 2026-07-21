"use client";
import { useEffect, useState } from "react";

interface PartnerOffer {
  id: string;
  brand: string;
  category: string;
  description: string;
  coinsRequired: number;
  discountValue: string;
  iconUrl: string | null;
  tag: string | null;
  termsUrl: string | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  sortOrder: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export default function AdminPartnerOffersPage() {
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PartnerOffer | null>(null);
  const [form, setForm] = useState({
    brand: "", category: "", description: "", coinsRequired: "",
    discountValue: "", iconUrl: "", tag: "", termsUrl: "",
    usageLimit: "", perUserLimit: "1", sortOrder: "0",
    startsAt: "", endsAt: "",
  });

  const fetchOffers = async () => {
    const res = await fetch("/api/admin/partner-offers");
    const data = await res.json();
    setOffers(data.offers ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const resetForm = () => {
    setForm({ brand: "", category: "", description: "", coinsRequired: "", discountValue: "", iconUrl: "", tag: "", termsUrl: "", usageLimit: "", perUserLimit: "1", sortOrder: "0", startsAt: "", endsAt: "" });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      coinsRequired: parseInt(form.coinsRequired),
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      perUserLimit: parseInt(form.perUserLimit),
      sortOrder: parseInt(form.sortOrder),
    };
    if (editing) {
      await fetch(`/api/admin/partner-offers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/partner-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setShowForm(false);
    resetForm();
    fetchOffers();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/partner-offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchOffers();
  };

  const editOffer = (o: PartnerOffer) => {
    setEditing(o);
    setForm({
      brand: o.brand, category: o.category, description: o.description,
      coinsRequired: o.coinsRequired.toString(), discountValue: o.discountValue,
      iconUrl: o.iconUrl ?? "", tag: o.tag ?? "", termsUrl: o.termsUrl ?? "",
      usageLimit: o.usageLimit?.toString() ?? "", perUserLimit: o.perUserLimit.toString(),
      sortOrder: o.sortOrder.toString(),
      startsAt: new Date(o.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(o.endsAt).toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Partner Offers</h1>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          style={{ background: "#E23744", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ New Offer"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required style={inputStyle} />
          <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={inputStyle} />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ ...inputStyle, gridColumn: "span 2" }} />
          <input placeholder="Discount value (e.g. ₹200 off)" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required style={inputStyle} />
          <input placeholder="Coins required" type="number" value={form.coinsRequired} onChange={e => setForm({ ...form, coinsRequired: e.target.value })} required style={inputStyle} />
          <input placeholder="Icon URL" value={form.iconUrl} onChange={e => setForm({ ...form, iconUrl: e.target.value })} style={inputStyle} />
          <input placeholder="Tag (Popular, Hot, New)" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} style={inputStyle} />
          <input placeholder="Terms URL" value={form.termsUrl} onChange={e => setForm({ ...form, termsUrl: e.target.value })} style={inputStyle} />
          <input placeholder="Usage limit (blank = unlimited)" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} style={inputStyle} />
          <input placeholder="Per-user limit" type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} style={inputStyle} />
          <input placeholder="Sort order" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} style={inputStyle} />
          <input placeholder="Start date" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} required style={inputStyle} />
          <input placeholder="End date" type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} required style={inputStyle} />
          <button type="submit" style={{ gridColumn: "span 2", background: "#E23744", color: "#fff", border: "none", padding: 12, borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
            {editing ? "Update Offer" : "Create Offer"}
          </button>
        </form>
      )}

      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={thStyle}>Brand</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Coins</th>
              <th style={thStyle}>Discount</th>
              <th style={thStyle}>Usage</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}><strong>{o.brand}</strong></td>
                <td style={tdStyle}>{o.category}</td>
                <td style={tdStyle}>{o.coinsRequired}</td>
                <td style={tdStyle}>{o.discountValue}</td>
                <td style={tdStyle}>{o.usageCount}{o.usageLimit ? `/${o.usageLimit}` : ""}</td>
                <td style={tdStyle}>
                  <span style={{ color: o.isActive ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                    {o.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => editOffer(o)}
                      style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                      Edit
                    </button>
                    <button onClick={() => toggleActive(o.id, o.isActive)}
                      style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                      {o.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "inherit",
};
const thStyle: React.CSSProperties = {
  padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5,
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: 14, color: "#0f172a",
};
