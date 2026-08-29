"use client";
import { useEffect, useState } from "react";

const pd = { ink: "#1a211e", white: "#ffffff", fog: "#eef1f0", mist: "#e0e0e0", graphite: "#606562", border: "#cccfcd" };

interface Affiliate { id: string; code: string; status: string; commissionPercent: number; }
interface Stats {
  clicks: number;
  commissions: Record<string, { total: number; count: number }>;
  availableForPayout: number;
}

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    fetch("/api/affiliate/me").then(r => r.json()).then(d => {
      setAffiliate(d.affiliate);
      setStats(d.stats);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    setApplying(true);
    await fetch("/api/affiliate/apply", { method: "POST" });
    load();
    setApplying(false);
  };

  const requestPayout = async () => {
    setRequesting(true);
    try {
      const res = await fetch("/api/affiliate/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(payoutAmount) }),
      });
      const d = await res.json();
      if (!res.ok) { setToast(d.error); return; }
      setToast("Payout requested!");
      setPayoutAmount("");
      load();
    } finally {
      setRequesting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <div style={{ padding: 64, textAlign: "center" }}>Loading…</div>;

  const referralLink = affiliate ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${affiliate.code}` : "";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px", color: pd.ink }}>
      <h1 style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 44, marginBottom: 8 }}>Affiliate Program</h1>
      <p style={{ color: pd.graphite, marginBottom: 32 }}>Earn commission by sharing product links.</p>

      {toast && <div style={{ background: pd.ink, color: "#fff", padding: "10px 16px", borderRadius: 4, marginBottom: 20 }}>{toast}</div>}

      {!affiliate ? (
        <div style={{ background: pd.fog, border: `1px solid ${pd.mist}`, padding: 32, borderRadius: 4 }}>
          <p style={{ marginBottom: 20 }}>You're not an affiliate yet. Apply below — approval is manual and usually takes 1-2 days.</p>
          <button onClick={apply} disabled={applying} style={{ background: pd.ink, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
            {applying ? "Applying…" : "Apply Now"}
          </button>
        </div>
      ) : affiliate.status === "pending" ? (
        <div style={{ background: "#fff8e1", border: "1px solid #f0d78c", padding: 24, borderRadius: 4 }}>
          Your application is under review. Your code will be <strong>{affiliate.code}</strong> once approved.
        </div>
      ) : affiliate.status !== "approved" ? (
        <div style={{ background: "#fee", border: "1px solid #fbb", padding: 24, borderRadius: 4 }}>
          Your affiliate account is currently <strong>{affiliate.status}</strong>. Contact support for details.
        </div>
      ) : (
        <>
          <div style={{ background: pd.fog, border: `1px solid ${pd.mist}`, padding: 24, borderRadius: 4, marginBottom: 24 }}>
            <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: pd.graphite, marginBottom: 8 }}>Your Referral Link</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={referralLink} style={{ flex: 1, padding: 10, border: `1px solid ${pd.border}`, borderRadius: 4 }} />
              <button onClick={() => navigator.clipboard.writeText(referralLink)} style={{ background: pd.ink, color: "#fff", border: "none", padding: "0 16px", borderRadius: 4, cursor: "pointer" }}>Copy</button>
            </div>
            <p style={{ fontSize: 13, color: pd.graphite, marginTop: 8 }}>Commission rate: {affiliate.commissionPercent}%</p>
          </div>

          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Clicks", value: stats.clicks },
                { label: "Pending", value: `₹${stats.commissions.pending?.total.toFixed(0) ?? 0}` },
                { label: "Approved", value: `₹${stats.commissions.approved?.total.toFixed(0) ?? 0}` },
                { label: "Available", value: `₹${stats.availableForPayout.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} style={{ border: `1px solid ${pd.mist}`, borderRadius: 4, padding: 16, textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: pd.graphite, textTransform: "uppercase", margin: "4px 0 0" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: `1px solid ${pd.mist}`, borderRadius: 4, padding: 24 }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Request Payout</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder={`Up to ₹${stats?.availableForPayout.toFixed(0) ?? 0}`}
                style={{ flex: 1, padding: 10, border: `1px solid ${pd.border}`, borderRadius: 4 }}
              />
              <button
                onClick={requestPayout}
                disabled={requesting || !payoutAmount}
                style={{ background: pd.ink, color: "#fff", border: "none", padding: "0 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer", opacity: !payoutAmount ? 0.5 : 1 }}
              >
                {requesting ? "…" : "Request"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}