"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Store, Settings, ChevronLeft,
  Bell, LogOut, User, Search, ExternalLink, Percent, Tags, Wallet, RotateCcw,
  MessageSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/admin",            icon: LayoutDashboard },
  { label: "Orders",     href: "/admin/orders",     icon: Package },
  { label: "Products",   href: "/admin/products",   icon: ShoppingBag },
  { label: "Vendors",    href: "/admin/vendors",    icon: Store },
  { label: "Users",      href: "/admin/users",      icon: Users },
  { label: "Returns",    href: "/admin/returns",    icon: RotateCcw },
  { label: "Broadcasts", href: "/admin/broadcasts", icon: MessageSquare },
  { label: "Payouts",    href: "/admin/payouts",    icon: Wallet },
  { label: "Coins",      href: "/admin/coins",      icon: Settings },
  { label: "Coupons",    href: "/admin/coupons",    icon: Percent },
  { label: "Partner Offers", href: "/admin/partner-offers", icon: Tags },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/me")
      .then(r => r.json())
      .then(d => { if (d?.name) setAdminName(d.name); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const isOrder = /^[a-f0-9-]+$/i.test(q) && q.length > 8;
    if (isOrder) {
      router.push(`/admin/orders?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/admin/products?search=${encodeURIComponent(q)}`);
    }
    setSearchQuery("");
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-b2w-bg flex">
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-40 bg-b2w-navy text-white flex flex-col transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/10 shrink-0">
          <div className="w-7 h-7 bg-b2w-brand rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            B2
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide truncate">B2World Admin</span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition cursor-pointer bg-transparent border-none text-white"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer border-none text-left ${
                  isActive
                    ? "bg-b2w-brand text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-3 shrink-0">
          <button
            onClick={() => window.open("https://b2world.com", "_blank")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white/80 transition cursor-pointer border-none bg-transparent"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Visit Store</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-b2w-border h-14 flex items-center gap-3 px-4 md:px-6 shrink-0">
          <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-md relative">
            <Search className="absolute left-3 w-4 h-4 text-b2w-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, products..."
              className="w-full h-9 pl-9 pr-3 text-sm bg-b2w-bg border border-b2w-border rounded-lg outline-none focus:border-b2w-brand/50 focus:ring-1 focus:ring-b2w-brand/20 placeholder:text-b2w-muted"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-b2w-muted hover:text-b2w-navy hover:bg-b2w-bg transition cursor-pointer bg-transparent border-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-b2w-brand rounded-full" />
            </button>

            <div className="w-px h-6 bg-b2w-border" />

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-b2w-bg transition cursor-pointer bg-transparent border-none text-b2w-navy"
              >
                <div className="w-7 h-7 rounded-full bg-b2w-navy flex items-center justify-center text-white text-xs font-bold">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden md:inline">{adminName}</span>
                <ChevronLeft className={`w-3.5 h-3.5 text-b2w-muted transition-transform ${profileOpen ? "-rotate-90" : "rotate-0"}`} />
              </button>

              {profileOpen && (
                <div className="absolute top-full right-0 mt-1 min-w-[200px] bg-white rounded-lg shadow-lg border border-b2w-border overflow-hidden z-50">
                  <button
                    onClick={() => { router.push("/settings"); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-b2w-navy hover:bg-b2w-bg transition cursor-pointer bg-transparent border-none text-left"
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    Settings
                  </button>
                  <div className="border-t border-b2w-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-b2w-red hover:bg-red-50 transition cursor-pointer bg-transparent border-none text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
