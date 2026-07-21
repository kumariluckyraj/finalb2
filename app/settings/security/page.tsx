"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", emberRed: "#cc2e39",
};

export default function SecurityPage() {
  const router = useRouter();
  
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords do not match.");
      return;
    }
    setLoading(true);
    // Simulate API call for password update
    setTimeout(() => {
      alert("Password updated successfully!");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setLoading(false);
    }, 1000);
  };

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
        .pd-btn-ghost {
          background: transparent; color: ${pd.carbonInk}; border: none;
          padding: 0; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: opacity 0.2s;
        }
        .pd-btn-ghost:hover { opacity: 0.7; }
        .pd-btn-danger {
          background: transparent; color: ${pd.emberRed}; border: 1px solid ${pd.emberRed};
          padding: 12px 24px; border-radius: 4px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: background 0.2s;
        }
        .pd-btn-danger:hover { background: #fff0f0; }
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
            Login & Security
          </h1>
          <p style={{ margin: "16px 0 0", color: pd.graphite, fontSize: 16 }}>
            Manage your password, 2-step verification, and account status.
          </p>
        </div>

        <div style={{ animation: "fadeSlideIn 0.3s ease", display: "flex", flexDirection: "column", gap: 48 }}>
          
          {/* Password Section */}
          <section>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 24px", fontWeight: 400 }}>
              Change Password
            </h2>
            <div style={{ border: `1px solid ${pd.mist}`, padding: 32, background: pd.paperWhite }}>
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 400 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Current Password</label>
                  <input type="password" required className="pd-input" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>New Password</label>
                  <input type="password" required minLength={8} className="pd-input" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Confirm New Password</label>
                  <input type="password" required minLength={8} className="pd-input" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                </div>
                <button type="submit" className="pd-btn" disabled={loading} style={{ alignSelf: "flex-start", marginTop: 8 }}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </section>

          {/* 2-Step Verification Section */}
          <section>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 24px", fontWeight: 400 }}>
              2-Step Verification
            </h2>
            <div style={{ border: `1px solid ${pd.mist}`, padding: 32, background: pd.paperWhite, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>Two-Factor Authentication (2FA)</p>
                <p style={{ margin: 0, fontSize: 14, color: pd.graphite }}>Add an extra layer of security to your account.</p>
              </div>
              <button className="pd-btn-ghost" onClick={() => alert("2FA setup coming soon!")}>
                Enable
              </button>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 24px", fontWeight: 400, color: pd.emberRed }}>
              Danger Zone
            </h2>
            <div style={{ border: `1px solid ${pd.emberRed}`, padding: 32, background: "#fff0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: pd.emberRed }}>Deactivate Account</p>
                <p style={{ margin: 0, fontSize: 14, color: pd.graphite }}>Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              <button className="pd-btn-danger" onClick={() => { if(confirm("Are you absolutely sure you want to delete your account?")) alert("Account deletion requires contacting support."); }}>
                Delete Account
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
