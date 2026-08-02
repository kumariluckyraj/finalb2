"use client";
import { useState } from "react";

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537"
};

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 90 Days" },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExported, setLastExported] = useState<string | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/visitors/export?days=${days}`);
      if (!res.ok) throw new Error("Export failed. Please try again.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = `anonymous-visitors-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setLastExported(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to export. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, fontFamily: "var(--font-geist, 'Inter', sans-serif)", color: pd.carbonInk }}>
      <style>{`
        .an-btn {
          background: ${pd.carbonInk}; color: ${pd.paperWhite}; border: none;
          padding: 14px 32px; border-radius: 4px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: opacity 0.2s;
          display: inline-flex; align-items: center; gap: 10px;
        }
        .an-btn:hover:not(:disabled) { opacity: 0.85; }
        .an-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .an-select {
          border: 1px solid ${pd.ashBorder}; border-radius: 4px; padding: 12px 16px;
          font-size: 14px; color: ${pd.carbonInk}; outline: none; font-family: inherit;
          background: ${pd.fog}; cursor: pointer; transition: border-color 0.2s;
        }
        .an-select:focus { border-color: ${pd.carbonInk}; }
        .an-spin {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%; animation: an-spin 0.7s linear infinite;
          display: inline-block; flex-shrink: 0;
        }
        @keyframes an-spin { to { transform: rotate(360deg); } }
        @keyframes an-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>

        <div style={{ marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(40px, 6vw, 56px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 12px", fontWeight: 400 }}>
            Visitor Analytics
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: pd.graphite, maxWidth: 560, lineHeight: 1.5 }}>
            Export anonymous visitor sessions and page-view activity as an Excel workbook for offline analysis.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Export card */}
          <div style={{ background: pd.paperWhite, border: `1px solid ${pd.mist}`, borderRadius: 4, padding: 32 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 26, margin: "0 0 8px", fontWeight: 400 }}>
              Export Report
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 13, color: pd.graphite }}>
              Includes a session summary sheet and a full page-view log.
            </p>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>
                Time Range
              </label>
              <select
                className="an-select"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                style={{ minWidth: 220 }}
              >
                {RANGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button onClick={handleExport} disabled={downloading} className="an-btn">
              {downloading && <span className="an-spin" />}
              {downloading ? "Preparing File" : "Export to Excel"}
            </button>

            {error && (
              <p style={{ margin: "16px 0 0", fontSize: 13, color: "#cc2e39", animation: "an-fade 0.2s ease" }}>
                {error}
              </p>
            )}
            {lastExported && !error && (
              <p style={{ margin: "16px 0 0", fontSize: 13, color: pd.graphite, animation: "an-fade 0.2s ease" }}>
                Last export downloaded at {lastExported}
              </p>
            )}
          </div>

          {/* Info / what's included card */}
          <div style={{ background: pd.fog, border: `1px solid ${pd.mist}`, borderRadius: 4, padding: 32 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.057em", color: pd.graphite, marginBottom: 20, fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)" }}>
              What's Included
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { title: "Visitors Summary", desc: "One row per anonymous visitor — first/last seen, visit count, referrer, UTM tags, and conversion status." },
                { title: "Page View Log", desc: "Every recorded page or product view, timestamped, up to 20,000 most recent rows." },
              ].map(row => (
                <div key={row.title} style={{ borderBottom: `1px solid ${pd.ashBorder}`, paddingBottom: 18 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: pd.carbonInk }}>{row.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: pd.graphite, lineHeight: 1.5 }}>{row.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: "18px 0 0", fontSize: 12, color: pd.graphite, lineHeight: 1.5 }}>
              Data is anonymized: visitors are identified only by a cookie ID, not by name or email, unless they've since created an account.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}