"use client";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();
  const sections = [
    { title: "Orders", desc: "Manage and track all orders", href: "/admin/orders", icon: "O" },
    { title: "Vendors", desc: "Manage seller accounts", href: "/admin/vendors", icon: "V" },
    { title: "Coins", desc: "Manage wallets, campaigns, and rules", href: "/admin/coins", icon: "C" },
  ];

  return (
    <div className="min-h-screen bg-soft-canvas">
      <div className="max-w-4xl mx-auto px-3 py-4 md:py-6">
        <h1 className="text-2xl font-bold text-ink-black mb-4">Admin Panel</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(s => (
            <button key={s.href} onClick={() => router.push(s.href)}
              className="bg-white border border-hairline rounded-lg p-5 text-left hover:border-brand-blue/40 transition cursor-pointer">
              <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3">{s.icon}</div>
              <h2 className="text-lg font-bold text-ink-black">{s.title}</h2>
              <p className="text-sm text-slate mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
