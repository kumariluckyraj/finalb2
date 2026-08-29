"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { JwtPayload } from "@/types/auth";

import LanguagePicker from "@/components/LanguagePicker";
import { Package, Tag, Bell, Scale, Settings, Store, LogOut, RotateCcw } from "lucide-react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="#606562" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SuperCoinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#F59E0B" />
    <circle cx="12" cy="12" r="8" fill="#D97706" />
    <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FEF3C7">SC</text>
  </svg>
);

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LoginIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const MicIcon = ({ active }: { active: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? "#cc2e39" : "none"}
    stroke={active ? "#cc2e39" : "#606562"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0014 0" />
    <line x1="12" y1="21" x2="12" y2="17" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#888" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CategoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

// ─── Voice Search Hook ────────────────────────────────────────────────────────

interface SR {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  start(): void;
  stop(): void;
}
type SRCtor = new () => SR;

function useVoiceSearch(onResult: (text: string) => void, locale: string) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SR | null>(null);

  const startListening = useCallback(() => {
    const Ctor: SRCtor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!Ctor) {
      setError("Voice search not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error !== "no-speech") setError("Voice error: " + e.error);
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult, locale]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, error, startListening, stopListening, clearError: () => setError(null) };
}

// ─── Defaults (overridable via props for reuse/localization) ─────────────────

const DEFAULT_SEARCH_CATEGORIES = [
  "All Categories",
  "Fashion",
  "Mobiles",
  "Electronics",
  "Beauty",
  "Grocery",
  "Furniture",
  "Sports",
  "Books",
];

const DEFAULT_NAV_CATEGORIES = [
  "Fashion", "Mobiles", "Electronics", "Beauty", "Grocery", "Furniture", "Sports", "Books",
];

// ─── Shared page container width ───────────────────────────────────────────
// Kept as one constant string so every section (navbar, hero, grids, etc.)
// stays in sync. Change PAGE_MAX_W in one place to resize the whole site.
const PAGE_MAX_W = "max-w-[1200px]";

// ─── Navbar ───────────────────────────────────────────────────────────────────

interface NavbarProps {
  user: JwtPayload | null;
  hasSellerProfile?: boolean;
  sellerOnboardingCompleted?: boolean;
  /** Category links shown in the nav strip / mobile drawer. */
  categories?: string[];
  /** Options shown in the search-bar category filter (includes an "all" option). */
  searchCategories?: string[];
  brandName?: string;
  searchPlaceholder?: string;
  /** BCP-47 locale passed to the browser's SpeechRecognition API. */
  voiceLocale?: string;
}

export default function Navbar({
  user,
  hasSellerProfile = false,
  sellerOnboardingCompleted = false,
  categories = DEFAULT_NAV_CATEGORIES,
  searchCategories = DEFAULT_SEARCH_CATEGORIES,
  brandName = "B2World",
  searchPlaceholder = "Search for products",
  voiceLocale = "en-US",
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchVal, setSearchVal] = useState("");
  const [searchCategory, setSearchCategory] = useState(searchCategories[0] ?? "All Categories");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const catFilterRef = useRef<HTMLDivElement>(null);

  const allCategoriesLabel = searchCategories[0] ?? "All Categories";

  function buildSearchUrl(query: string) {
    const params = new URLSearchParams({ q: query });
    return searchCategory !== allCategoriesLabel
      ? `/products/${searchCategory.toLowerCase()}?${params.toString()}`
      : `/products?${params.toString()}`;
  }

  // ── Voice search ──────────────────────────────────────────────────────────
  const handleVoiceResult = useCallback((text: string) => {
    setSearchVal(text);
    setVoiceToast(`Heard: "${text}"`);
    setTimeout(() => setVoiceToast(null), 3000);
    setTimeout(() => router.push(buildSearchUrl(text)), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchCategory]);

  const { isListening, error: voiceError, startListening, stopListening, clearError } =
    useVoiceSearch(handleVoiceResult, voiceLocale);

  // ── Cart count ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCount = () => {
      fetch("/api/cart")
        .then((r) => r.json())
        .then((d) => {
          if (d.items) {
            const count = d.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
            setCartCount(count);
          }
        })
        .catch(() => { });
    };
    fetchCount();
    window.addEventListener("cart-updated", fetchCount);
    return () => window.removeEventListener("cart-updated", fetchCount);
  }, []);

  // ── Coin balance ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/coins/wallet")
      .then(r => r.json())
      .then(d => { setCoinBalance(d.wallet?.balance ?? null); })
      .catch(() => { });
  }, []);

  // ── Wishlist count ────────────────────────────────────────────────────────
  useEffect(() => {
    const refresh = () => {
      if (user) {
        fetch("/api/wishlist")
          .then(r => r.json())
          .then(d => { if (d.count !== undefined) setWishlistCount(d.count); })
          .catch(() => setWishlistCount(0));
      } else {
        setWishlistCount(0);
      }
    };
    refresh();
    window.addEventListener("wishlist-updated", refresh);
    return () => window.removeEventListener("wishlist-updated", refresh);
  }, [user]);

  // ── Autocomplete search ───────────────────────────────────────────────────
  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(searchVal.trim())}&limit=5`)
        .then(r => r.json())
        .then(d => {
          if (d.products) setSearchResults(d.products);
        })
        .catch(() => { });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal]);

  function handleSearch() {
    const q = searchVal.trim();
    if (!q) return;
    router.push(buildSearchUrl(q));
  }

  // ── Outside clicks ────────────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (catFilterRef.current && !catFilterRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") return null;

  // /admin and /vendor sections render their own dedicated navigation
  // (AdminLayout / VendorLayout) — rendering this navbar there too would
  // stack a duplicate header on top of theirs.
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) return null;

  // ── Account dropdown menu items ───────────────────────────────────────────
  const accountMenuItems = (
    <>
      <button onClick={() => { router.push("/cart"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"><CartIcon /> Cart{cartCount > 0 && <span className="ml-auto bg-[#1a211e] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>}</button>
      <button onClick={() => { router.push("/myprofile"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <ProfileIcon /> My Profile</button>
      <button onClick={() => { router.push("/myorders"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Package className="w-5 h-5 shrink-0" /> My Orders</button>
      <button onClick={() => { router.push("/returns"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <RotateCcw className="w-5 h-5 shrink-0" /> My Returns</button>
      <button onClick={() => { router.push("/wishlist"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <HeartIcon /> Wishlist</button>
      <button onClick={() => { router.push("/coupons"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Tag className="w-5 h-5 shrink-0" /> Coupons & Rewards</button>
      <button onClick={() => { router.push("/notifications"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Bell className="w-5 h-5 shrink-0" /> Notifications</button>
      <button onClick={() => { router.push("/compare"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Scale className="w-5 h-5 shrink-0" /> Compare</button>
      <button onClick={() => { router.push("/wallet"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <SuperCoinIcon /> SuperCoins{coinBalance !== null && <span className="ml-auto text-[12px] text-[#1a211e] font-bold">{coinBalance}</span>}</button>
      <button onClick={() => { router.push("/settings"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Settings className="w-5 h-5 shrink-0" /> Account Settings</button>
      <button onClick={() => { router.push("/account/affiliate"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Settings className="w-5 h-5 shrink-0" /> Affiliate</button>
      {(hasSellerProfile || user?.role === 'vendor') ? (
        sellerOnboardingCompleted ? (
          <button onClick={() => { const sd = process.env.NEXT_PUBLIC_SELLER_DOMAIN; if (sd) { window.location.href = window.location.protocol + '//' + sd; } else { router.push('/vendor/dashboard'); } setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Store className="w-5 h-5 shrink-0" /> Seller Dashboard</button>
        ) : (
          <button onClick={() => { router.push('/vendor/onboarding'); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#cc2e39] font-semibold cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Store className="w-5 h-5 shrink-0" /> Complete Seller Setup</button>
        )
      ) : user?.role !== 'admin' && (
        <button onClick={() => { router.push("/sell-online"); setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#cc2e39] font-semibold cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Store className="w-5 h-5 shrink-0" /> Become a Seller</button>
      )}
      {user?.role === 'admin' && (
        <button onClick={() => { const ad = process.env.NEXT_PUBLIC_ADMIN_DOMAIN; if (ad) { window.location.href = window.location.protocol + '//' + ad; } else { router.push("/admin"); } setDropdownOpen(false); }} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#1a211e] cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <Settings className="w-5 h-5 shrink-0" /> Admin</button>
      )}
      <div className="h-px bg-[#e0e0e0] mx-4" />
      <button onClick={handleLogout} className="w-full bg-transparent border-none px-5 py-3 text-[14px] text-[#cc2e39] font-semibold cursor-pointer flex items-center gap-3 text-left hover:bg-[#eef1f0] transition-colors"> <LogoutIcon /> Logout</button>
    </>
  );

  return (
    <>
      {/* ── Voice listening toast ─────────────────────────────────────────── */}
      {(isListening || voiceToast || voiceError) && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1a211e] text-white px-5 py-2.5 rounded text-[14px] flex items-center gap-2 animate-[fadeIn_0.2s_ease]"
          style={{ letterSpacing: '0.02em' }}>
          {isListening && (
            <span className="w-2 h-2 rounded-full bg-[#cc2e39] inline-block animate-pulse" />
          )}
          {isListening ? "Listening… speak now" : voiceError ?? voiceToast}
          {(voiceError || voiceToast) && (
            <button
              onClick={() => { clearError(); setVoiceToast(null); }}
              className="bg-transparent border-none text-[#aaa] cursor-pointer p-0.5"
            >
              <XIcon />
            </button>
          )}
        </div>
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setMobileMenuOpen(false); }}
          role="presentation"
        >
          <div
            className="absolute top-0 left-0 bottom-0 w-[300px] bg-white animate-[slideInLeft_0.3s_ease] flex flex-col"
            onClick={e => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setMobileMenuOpen(false); }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="bg-[#1a211e] px-6 py-6 text-white">
              {user ? (
                <>
                  <p className="m-0 font-bold text-[16px] tracking-wide">{user.name || "User"}</p>
                  <p className="m-0 text-[13px] opacity-60 mt-1">{user.email}</p>
                </>
              ) : (
                <p className="m-0 font-bold text-[16px] tracking-wide cursor-pointer" onClick={() => { setMobileMenuOpen(false); router.push("/login"); }}>Login / Register</p>
              )}
            </div>

            {/* Drawer links */}
            <div className="py-4 flex-1 overflow-y-auto">
              {user ? (
                accountMenuItems
              ) : (
                <>
                  <button onClick={() => { setMobileMenuOpen(false); router.push("/cart"); }} className="w-full bg-transparent border-none px-6 py-3.5 flex items-center gap-4 text-[15px] text-[#1a211e] cursor-pointer hover:bg-[#eef1f0] transition-colors"><CartIcon /> Cart{cartCount > 0 && <span className="ml-auto bg-[#1a211e] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>}</button>
                  <button onClick={() => { setMobileMenuOpen(false); router.push("/"); }} className="w-full bg-transparent border-none px-6 py-3.5 flex items-center gap-4 text-[15px] text-[#1a211e] cursor-pointer hover:bg-[#eef1f0] transition-colors"><HomeIcon /> Home</button>
                  <button onClick={() => { setMobileMenuOpen(false); router.push("/products"); }} className="w-full bg-transparent border-none px-6 py-3.5 flex items-center gap-4 text-[15px] text-[#1a211e] cursor-pointer hover:bg-[#eef1f0] transition-colors"><CategoryIcon /> Categories</button>
                  <button onClick={() => { setMobileMenuOpen(false); router.push("/login"); }} className="w-full bg-transparent border-none px-6 py-3.5 flex items-center gap-4 text-[15px] text-[#1a211e] cursor-pointer hover:bg-[#eef1f0] transition-colors"><LoginIcon /> Login</button>
                </>
              )}

              {/* Categories in drawer */}
              <div className="h-px bg-[#e0e0e0] mx-5 my-3" />
              <div className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#606562]">Shop by Category</div>
              {categories.map(cat => (
                <button key={cat} onClick={() => { setMobileMenuOpen(false); router.push(`/products/${cat.toLowerCase()}`); }}
                  className="w-full bg-transparent border-none px-6 py-3 text-[14px] text-[#1a211e] cursor-pointer text-left hover:bg-[#eef1f0] transition-colors font-medium">
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Buyer Navbar — Peak Design Style ─────────────────────────────── */}
      {/* Tier 1: Announcement Bar */}
      <div className="bg-[#1a211e] text-white text-center py-2 text-[12px] font-bold uppercase tracking-[0.1em] overflow-hidden">
        <div className={`${PAGE_MAX_W} mx-auto px-4 md:px-10 flex items-center justify-between`}>
          <span className="hidden md:inline text-[11px] font-normal tracking-[0.05em] opacity-70 cursor-pointer hover:opacity-100 transition-opacity whitespace-nowrap">Our Mission</span>
          <div className="flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="text-[10px] md:text-[12px]">FREE DELIVERY</span>
            <span className="mx-1 md:mx-3 opacity-30">·</span>
            <span className="text-[10px] md:text-[12px]">EASY RETURNS</span>
            <span className="mx-1 md:mx-3 opacity-30">·</span>
            <span className="text-[10px] md:text-[12px]">SECURE PAYMENTS</span>
          </div>
          <span className="hidden md:inline text-[11px] font-normal tracking-[0.05em] opacity-70 cursor-pointer hover:opacity-100 transition-opacity whitespace-nowrap">Find a Store</span>
        </div>
      </div>

      {/* Tier 2: Primary Navigation */}
      <nav className="bg-white border-b border-[#e0e0e0]">
        <div className={`${PAGE_MAX_W} mx-auto px-4 md:px-10 h-16 flex items-center gap-2 md:gap-4`}>

          {/* Mobile hamburger */}
          <button aria-label="Open Menu" aria-expanded={mobileMenuOpen} className="md:hidden bg-transparent border-none text-[#1a211e] cursor-pointer p-1 shrink-0" onClick={() => setMobileMenuOpen(true)}>
            <MenuIcon />
          </button>

          {/* Logo */}
          <div onClick={() => router.push("/")} className="cursor-pointer shrink-0 mr-1 md:mr-2">
            <div className="text-[#1a211e] font-extrabold text-[20px] md:text-[22px] tracking-tight leading-none" style={{ letterSpacing: '-0.03em' }}>{brandName}</div>
          </div>

         {/* Category links — desktop */}
<div className="hidden xl:flex items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-hide">
  {categories.map(cat => (
    <button
      aria-label={`Category ${cat}`}
      key={cat}
      onClick={() => router.push(`/products/${cat.toLowerCase()}`)}
      className="bg-transparent border-none text-[13px] font-bold text-[#363537] cursor-pointer py-1 px-2.5 uppercase tracking-[0.057em] transition-colors duration-200 hover:text-[#1a211e] whitespace-nowrap shrink-0"
    >
      {cat}
    </button>
  ))}
</div>

          {/* Search input */}
          <div className="hidden md:block flex-1 max-w-[420px] ml-auto relative">
            <div className="flex h-10 rounded bg-[#eef1f0] border border-[#cccfcd] items-center overflow-hidden">
              {/* Category filter */}
              <div ref={catFilterRef} className="relative shrink-0 h-full">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(v => !v)}
                  className="h-full px-3 flex items-center gap-1 text-[12px] font-semibold text-[#363537] bg-[#e4e7e5] border-r border-[#cccfcd] cursor-pointer whitespace-nowrap"
                >
                  {searchCategory}
                  <ChevronDown />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 min-w-[160px] max-h-72 overflow-y-auto bg-white rounded border border-[#e0e0e0] z-[300]">
                    {searchCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSearchCategory(cat); setShowCategoryDropdown(false); }}
                        className={`w-full bg-transparent border-none px-4 py-2 text-[13px] text-left cursor-pointer hover:bg-[#eef1f0] ${cat === searchCategory ? "font-bold text-[#1a211e]" : "text-[#363537]"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pl-3 flex items-center shrink-0">
                <SearchIcon />
              </div>
              <input
                value={searchVal}
                onChange={(e) => { setSearchVal(e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={searchPlaceholder}
                className="flex-1 border-none outline-none px-3 text-[14px] text-[#1a211e] min-w-0 bg-transparent placeholder:text-[#606562]"
              />
              {searchVal && (
                <button aria-label="Clear Search" onClick={() => { setSearchVal(""); setSearchResults([]); }} className="bg-transparent border-none px-2 cursor-pointer text-[#606562] flex items-center hover:text-[#1a211e]"><XIcon /></button>
              )}
              <button onClick={isListening ? stopListening : startListening} className="bg-transparent border-none px-2 cursor-pointer flex items-center" aria-label="Voice Search"><MicIcon active={isListening} /></button>
            </div>
            {/* Autocomplete */}
            {showAutocomplete && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded border border-[#e0e0e0] overflow-hidden z-[300]">
                {searchResults.map((p: any) => (
                  <button key={p.id} onClick={() => { router.push(`/products/${p.slug || p.id}`); setShowAutocomplete(false); }} className="w-full bg-transparent border-none px-4 py-3 text-[14px] text-left cursor-pointer flex items-center gap-3 hover:bg-[#eef1f0] transition-colors">
                    {p.image && <img src={p.image} alt="" className="w-8 h-8 object-cover rounded" />}
                    <span className="truncate text-[#1a211e]">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-3 ml-auto md:ml-2 shrink-0">
            <div className="hidden md:block"><LanguagePicker variant="light" /></div>

            {/* Wishlist */}
            <button aria-label="Wishlist" onClick={() => router.push("/wishlist")} className="hidden md:flex bg-transparent border-none text-[#1a211e] cursor-pointer p-2 relative hover:opacity-70 transition-opacity">
              <HeartIcon />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a211e] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </button>

            {/* Account */}
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button aria-label="Account" aria-expanded={dropdownOpen} aria-haspopup="true" onClick={() => setDropdownOpen((prev) => !prev)} className="bg-transparent border-none text-[#1a211e] cursor-pointer p-2 flex items-center gap-1 hover:opacity-70 transition-opacity">
                  <ProfileIcon />
                  <span className="hidden lg:inline text-[13px] font-bold uppercase tracking-[0.04em]">{user.name ?? "Account"}</span>
                  <ChevronDown />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] right-0 min-w-[240px] bg-white rounded border border-[#e0e0e0] overflow-hidden z-[300] animate-[fadeSlideDown_0.15s_ease] py-2">
                    {accountMenuItems}
                  </div>
                )}
              </div>
            ) : (
              <button aria-label="Login" onClick={() => router.push("/login")} className="bg-[#1a211e] text-white border-none h-[36px] px-5 rounded text-[13px] font-bold cursor-pointer uppercase tracking-[0.057em] hover:bg-[#363537] transition-colors">Login</button>
            )}

            {/* Cart */}
            <button aria-label="Cart" onClick={() => router.push("/cart")} className="bg-transparent border-none text-[#1a211e] cursor-pointer p-2 relative hover:opacity-70 transition-opacity flex items-center gap-1">
              <CartIcon />
              <span className="hidden lg:inline text-[13px] font-bold uppercase tracking-[0.04em]">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 left-4 bg-[#1a211e] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Category Strip — shown below nav on smaller screens */}
        <div className="hidden md:block xl:hidden border-t border-[#e0e0e0]">
          <div className={`${PAGE_MAX_W} mx-auto px-4 md:px-10 py-2 flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide`}>
            {categories.map(cat => (
              <button aria-label={`Category ${cat}`} key={cat} onClick={() => router.push(`/products/${cat.toLowerCase()}`)}
                className="bg-transparent border-none text-[13px] font-bold text-[#363537] cursor-pointer py-1.5 px-3 uppercase tracking-[0.057em] transition-colors duration-200 hover:text-[#1a211e] shrink-0">
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Search Row */}
        <div className="md:hidden px-3 pb-3 w-full">
          <div className="flex h-10 rounded bg-[#eef1f0] border border-[#cccfcd] items-center overflow-hidden relative">
            <div className="pl-3 flex items-center shrink-0">
              <SearchIcon />
            </div>
            <input
              value={searchVal}
              onChange={(e) => { setSearchVal(e.target.value); setShowAutocomplete(true); }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={searchPlaceholder}
              className="flex-1 border-none outline-none px-3 text-[14px] text-[#1a211e] w-full min-w-0 bg-transparent placeholder:text-[#606562]"
            />
            {searchVal && (
              <button aria-label="Clear Search" onClick={() => { setSearchVal(""); setSearchResults([]); }} className="bg-transparent border-none px-2 cursor-pointer text-[#606562] flex items-center hover:text-[#1a211e]"><XIcon /></button>
            )}
            <button onClick={isListening ? stopListening : startListening} className="bg-transparent border-none px-2 cursor-pointer flex items-center" aria-label="Voice Search"><MicIcon active={isListening} /></button>
          </div>
          {/* Mobile Autocomplete */}
          {showAutocomplete && searchResults.length > 0 && (
            <div className="absolute left-3 right-3 mt-1 bg-white rounded border border-[#e0e0e0] overflow-hidden z-[300]">
              {searchResults.map((p: any) => (
                <button key={p.id} onClick={() => { router.push(`/products/${p.slug || p.id}`); setShowAutocomplete(false); }} className="w-full bg-transparent border-none px-4 py-3 text-[14px] text-left cursor-pointer flex items-center gap-3 hover:bg-[#eef1f0] transition-colors">
                  {p.image && <img src={p.image} alt="" className="w-8 h-8 object-cover rounded" />}
                  <span className="truncate text-[#1a211e]">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}