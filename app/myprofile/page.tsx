"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", emberRed: "#cc2e39",
};

export default function MyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", phone: "" });
  const [infoLoading, setInfoLoading] = useState(false);

  // OTP State for Phone Change
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    fetch("/api/me").then(res => res.json())
      .then(userData => {
        if (userData.error) {
          router.push("/login");
          return;
        }
        setUser(userData.user);
        setInfoForm({ name: userData.user.name || "", phone: userData.user.phone || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveInfoClick = async () => {
    if (infoForm.name === user.name && infoForm.phone === user.phone) {
      setIsEditingInfo(false);
      return;
    }
    setInfoLoading(true);
    if (infoForm.phone !== user.phone) {
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: infoForm.phone })
        });
        if (res.ok) { setShowOtpModal(true); } 
        else { alert("Failed to send OTP to new number"); }
      } catch (e) { alert("Error sending OTP"); } 
      finally { setInfoLoading(false); }
      return;
    }
    await saveProfile(infoForm.name, infoForm.phone);
    setInfoLoading(false);
  };

  const verifyOtpAndSave = async () => {
    setOtpLoading(true); setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: infoForm.phone, otp })
      });
      if (!res.ok) { setOtpError("Invalid OTP. Try again."); return; }
      setShowOtpModal(false);
      await saveProfile(infoForm.name, infoForm.phone);
    } catch (e) { setOtpError("Error verifying OTP"); } 
    finally { setOtpLoading(false); }
  };

  const saveProfile = async (name: string, phone: string) => {
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (res.ok) { setUser(data.user); setIsEditingInfo(false); } 
      else { alert("Failed to update profile"); }
    } catch (e) { alert("Error updating profile"); }
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
            Profile
          </h1>
          <p style={{ margin: "16px 0 0", color: pd.graphite, fontSize: 16 }}>
            Manage your personal information.
          </p>
        </div>

        <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: 0, fontWeight: 400 }}>
              Personal Information
            </h2>
            {!isEditingInfo && (
              <button className="pd-btn-outline" onClick={() => setIsEditingInfo(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <div style={{ border: `1px solid ${pd.mist}`, padding: 32, display: "flex", flexDirection: "column", gap: 24, background: pd.paperWhite }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Full Name</label>
                <input className="pd-input" value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: pd.graphite, fontWeight: 600 }}>Phone Number</label>
                <input className="pd-input" value={infoForm.phone} onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <button className="pd-btn" onClick={handleSaveInfoClick} disabled={infoLoading}>
                  {infoLoading ? "Saving..." : "Save Changes"}
                </button>
                <button className="pd-btn-ghost" onClick={() => { setIsEditingInfo(false); setInfoForm({ name: user.name, phone: user.phone }); }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div>
                <p style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.057em", color: pd.graphite, margin: "0 0 8px", fontWeight: 700 }}>Full Name</p>
                <p style={{ fontSize: 18, color: pd.carbonInk, margin: 0 }}>{user.name}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.057em", color: pd.graphite, margin: "0 0 8px", fontWeight: 700 }}>Email Address</p>
                <p style={{ fontSize: 18, color: pd.carbonInk, margin: 0 }}>{user.email}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.057em", color: pd.graphite, margin: "0 0 8px", fontWeight: 700 }}>Phone Number</p>
                <p style={{ fontSize: 18, color: pd.carbonInk, margin: 0 }}>{user.phone || "Not added"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: pd.paperWhite, padding: 48, border: `1px solid ${pd.mist}`, width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, margin: "0 0 8px", fontWeight: 400 }}>
              Verify Phone
            </h2>
            <p style={{ margin: "0 0 24px", color: pd.graphite, fontSize: 14 }}>Enter the OTP sent to {infoForm.phone}</p>
            <input type="text" placeholder="Enter OTP" className="pd-input" value={otp} onChange={e => setOtp(e.target.value)} style={{ marginBottom: 16, textAlign: "center", letterSpacing: 8, fontSize: 24 }} />
            {otpError && <p style={{ color: pd.emberRed, margin: "0 0 16px", fontSize: 13 }}>{otpError}</p>}
            <div style={{ display: "flex", gap: 16 }}>
              <button className="pd-btn" style={{ flex: 1 }} onClick={verifyOtpAndSave} disabled={otpLoading}>
                {otpLoading ? "Verifying..." : "Verify & Save"}
              </button>
              <button className="pd-btn-ghost" onClick={() => { setShowOtpModal(false); setInfoLoading(false); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
