"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", emberRed: "#cc2e39",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me").then(res => res.json())
      .then(userData => {
        if (userData.error) {
          router.push("/login");
          return;
        }
        setUser(userData.user);
      })
      .catch(console.error);
  }, [router]);

  const cards = [
    { title: "Your Profile", desc: "Manage your name, email, and mobile number", link: "/myprofile" },
    { title: "Your Addresses", desc: "Edit or add new delivery addresses", link: "/addresses" },
    { title: "Your Orders", desc: "Track, return, or buy things again", link: "/myorders" },
    { title: "Login & Security", desc: "Change password and security settings", link: "/settings/security" },
    { title: "SuperCoins", desc: "View balance, ways to earn, and history", link: "/supercoin" },
    { title: "Notifications", desc: "Manage alerts, emails, and SMS", link: "/notifications" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, fontFamily: "var(--font-geist, 'Inter', sans-serif)", color: pd.carbonInk }}>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pd-setting-card {
          border: 1px solid ${pd.mist}; padding: 32px 24px; background: ${pd.paperWhite};
          display: flex; flex-direction: column; gap: 8px; transition: all 0.2s ease; cursor: pointer;
        }
        .pd-setting-card:hover { background: ${pd.fog}; transform: translateY(-2px); border-color: ${pd.ashBorder}; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px" }}>
        
        <div style={{ marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
            Account Settings
          </h1>
          <p style={{ margin: "16px 0 0", color: pd.graphite, fontSize: 16 }}>
            {user ? `Welcome back, ${user.name}` : "Loading account details..."}
          </p>
        </div>

        <div style={{ animation: "fadeSlideIn 0.3s ease", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {cards.map((card, i) => (
            <div key={i} className="pd-setting-card" onClick={() => router.push(card.link)}>
              <h3 style={{ margin: 0, fontSize: 18, color: pd.carbonInk, fontWeight: 600 }}>{card.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: pd.graphite, lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
