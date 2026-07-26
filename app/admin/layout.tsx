"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Store, Settings,
  Bell, LogOut, User, ChevronDown, Menu, ExternalLink, Percent,
  Tags, Wallet, RotateCcw, MessageSquare,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Dashboard",  href: "/admin",                icon: LayoutDashboard },
  { label: "Orders",     href: "/admin/orders",         icon: Package },
  { label: "Products",   href: "/admin/products",       icon: ShoppingBag },
  { label: "Vendors",    href: "/admin/vendors",        icon: Store },
  { label: "Users",      href: "/admin/users",          icon: Users },
  { label: "Returns",    href: "/admin/returns",        icon: RotateCcw },
  { label: "Broadcasts", href: "/admin/broadcasts",     icon: MessageSquare },
  { label: "Payouts",    href: "/admin/payouts",        icon: Wallet },
  { label: "Coins",      href: "/admin/coins",          icon: Settings },
  { label: "Coupons",    href: "/admin/coupons",        icon: Percent },
  { label: "Partner Offers", href: "/admin/partner-offers", icon: Tags },
  { label: "Messages",   href: "/admin/messages",       icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [roleLabel, setRoleLabel] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) { router.push("/login"); return; }
        if (d?.name) setAdminName(d.name);
        if (d?.role === "sub_admin") setRoleLabel("Sub Admin");
        else if (d?.role === "admin") setRoleLabel("Super Admin");
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-b2w-bg">
      <div className="w-8 h-8 border-4 border-b2w-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-b2w-bg flex flex-col">
      {/* ── Top Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-b2w-navy text-white h-14 flex items-center gap-2 md:gap-3 px-3 md:px-5 shadow-sm shrink-0">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden bg-transparent border-none text-white cursor-pointer p-1.5 rounded-lg hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div onClick={() => router.push("/admin")} className="cursor-pointer flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-b2w-brand rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
            B2
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-white font-bold text-sm">B2World Admin</span>
            {roleLabel && <span className="text-[10px] text-white/50">{roleLabel}</span>}
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 ml-4 overflow-x-auto flex-1 scrollbar-hide">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`flex items-center gap-1.5 bg-transparent border-none h-9 px-2.5 text-[12px] font-medium cursor-pointer whitespace-nowrap rounded-lg transition ${
                  isActive(link.href)
                    ? "text-white bg-white/15"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer bg-transparent border-none">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-b2w-brand rounded-full" />
          </button>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer bg-transparent border-none text-white/90"
            >
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-1 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
                <button
                  onClick={() => { router.push("/settings"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 cursor-pointer text-left hover:bg-gray-50 border-b border-gray-100 bg-transparent border-none"
                >
                  <Settings className="w-4 h-4 shrink-0" /> Account Settings
                </button>
                <button
                  onClick={() => { window.open("https://b2world.com", "_blank"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 cursor-pointer text-left hover:bg-gray-50 border-b border-gray-100 bg-transparent border-none"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" /> Visit Store
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 font-medium cursor-pointer text-left hover:bg-red-50 bg-transparent border-none"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-[260px] bg-white shadow-xl animate-[slideInLeft_0.2s_ease] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-b2w-navy px-4 py-4 text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-b2w-brand rounded-lg flex items-center justify-center text-white text-xs font-bold">B2</div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm">B2World Admin</span>
                {roleLabel && <span className="text-[10px] text-white/50">{roleLabel}</span>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {NAV_LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => { router.push(link.href); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left cursor-pointer bg-transparent border-none ${
                      isActive(link.href)
                        ? "text-b2w-brand font-semibold bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    {link.label}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 font-medium cursor-pointer bg-transparent border-none text-left hover:bg-red-50"
              >
                <LogOut className="w-4.5 h-4.5 shrink-0" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}