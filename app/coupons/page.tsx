"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ──────────────────────────── Types ──────────────────────────── */

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minCartValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  endsAt: string;
  startsAt: string;
}

type FilterTab = "all" | "percentage" | "fixed";
type SortOption = "ending" | "discount" | "newest";

/* ──────────────────────────── Inline SVG Icons ──────────────────────────── */

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#606562" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const ScissorsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const EmptyBoxIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cccfcd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

/* ──────────────────────────── Helpers ──────────────────────────── */

function getTimeRemaining(endsAt: string): { days: number; hours: number; minutes: number; expired: boolean } {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes, expired: false };
}

function formatDiscount(coupon: Coupon): string {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;
}

function getDiscountColor(coupon: Coupon): string {
  if (coupon.discountType === "fixed") return "#0c0c0c";
  if (coupon.discountValue >= 50) return "#cc2e39";
  if (coupon.discountValue >= 20) return "#1a211e";
  return "#606562";
}

/* ──────────────────────────── Countdown Hook ──────────────────────────── */

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(endsAt));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getTimeRemaining(endsAt));
    }, 60_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return remaining;
}

/* ──────────────────────────── Coupon Card ──────────────────────────── */

function CouponCard({ coupon, onApply }: { coupon: Coupon; onApply: () => void }) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(coupon.endsAt);
  const usagePercent = coupon.usageLimit ? Math.round((coupon.usageCount / coupon.usageLimit) * 100) : 0;
  const isAlmostGone = coupon.usageLimit ? usagePercent >= 75 : false;
  const isEndingSoon = countdown.days <= 2 && !countdown.expired;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = coupon.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="relative bg-white border border-[#e0e0e0] rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-[#cccfcd] group"
      style={{ animation: "fadeSlideIn 0.4s ease both" }}
    >
      {/* Urgency badges */}
      {(isEndingSoon || isAlmostGone) && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          {isEndingSoon && (
            <span className="bg-[#cc2e39] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ letterSpacing: "0.05em" }}>
              Ending Soon
            </span>
          )}
          {isAlmostGone && (
            <span className="bg-[#f59e0b] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ letterSpacing: "0.05em" }}>
              Almost Gone
            </span>
          )}
        </div>
      )}

      {/* Top: Discount banner */}
      <div
        className="px-6 pt-6 pb-4 flex items-start gap-4"
      >
        {/* Discount circle */}
        <div
          className="shrink-0 w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center border-2 transition-transform duration-300 group-hover:scale-105"
          style={{
            borderColor: getDiscountColor(coupon),
            color: getDiscountColor(coupon),
          }}
        >
          <span className="text-[18px] font-extrabold leading-none">
            {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
          </span>
          <span className="text-[9px] font-bold uppercase mt-0.5" style={{ letterSpacing: "0.1em" }}>
            OFF
          </span>
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-bold text-[#1a211e] m-0 mb-1 leading-snug">
            {coupon.title}
          </h3>
          {coupon.description && (
            <p className="text-[13px] text-[#606562] m-0 leading-relaxed line-clamp-2">
              {coupon.description}
            </p>
          )}
        </div>
      </div>

      {/* Dashed divider with scissors */}
      <div className="relative px-6 py-0">
        <div className="flex items-center gap-2">
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-[#eef1f0]" />
          <div className="flex-1 border-t-2 border-dashed border-[#e0e0e0]" />
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-[#eef1f0]" />
        </div>
      </div>

      {/* Code + Copy */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center justify-center h-[44px] rounded border-2 border-dashed border-[#cccfcd] bg-[#f8f9f9] text-[#1a211e] text-[15px] font-bold tracking-[0.1em] select-all"
            style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
          >
            {coupon.code}
          </div>
          <button
            onClick={handleCopy}
            className="h-[44px] px-4 flex items-center gap-1.5 rounded border border-[#1a211e] bg-transparent text-[#1a211e] text-[12px] font-bold uppercase cursor-pointer transition-all duration-200 hover:bg-[#1a211e] hover:text-white shrink-0"
            style={{ letterSpacing: "0.038em" }}
            aria-label={`Copy coupon code ${coupon.code}`}
          >
            {copied ? (
              <>
                <CheckIcon />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details row */}
      <div className="px-6 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {coupon.minCartValue && coupon.minCartValue > 0 && (
          <span className="flex items-center gap-1 text-[12px] text-[#606562]">
            <ShoppingBagIcon />
            Min. ₹{coupon.minCartValue.toLocaleString("en-IN")}
          </span>
        )}
        {coupon.maxDiscount && (
          <span className="flex items-center gap-1 text-[12px] text-[#606562]">
            <TagIcon />
            Max save ₹{coupon.maxDiscount.toLocaleString("en-IN")}
          </span>
        )}
        <span className="flex items-center gap-1 text-[12px]" style={{ color: isEndingSoon ? "#cc2e39" : "#606562" }}>
          <ClockIcon />
          {countdown.expired
            ? "Expired"
            : countdown.days > 0
              ? `${countdown.days}d ${countdown.hours}h left`
              : `${countdown.hours}h ${countdown.minutes}m left`}
        </span>
      </div>

      {/* Usage progress */}
      {coupon.usageLimit && (
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#606562]">
              {coupon.usageCount} / {coupon.usageLimit} used
            </span>
            <span className="text-[11px] font-semibold" style={{ color: isAlmostGone ? "#cc2e39" : "#606562" }}>
              {coupon.usageLimit - coupon.usageCount} remaining
            </span>
          </div>
          <div className="h-1.5 bg-[#eef1f0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usagePercent}%`,
                background: isAlmostGone
                  ? "linear-gradient(90deg, #f59e0b, #cc2e39)"
                  : "linear-gradient(90deg, #1a211e, #363537)",
              }}
            />
          </div>
        </div>
      )}

      {/* CTA button */}
      <div className="px-6 pb-5 pt-1">
        <button
          onClick={onApply}
          className="w-full h-[44px] flex items-center justify-center gap-2 rounded bg-[#1a211e] text-white text-[13px] font-bold uppercase border-none cursor-pointer transition-all duration-200 hover:bg-[#0c0c0c]"
          style={{ letterSpacing: "0.057em" }}
        >
          Apply at Checkout
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────── How-To Steps ──────────────────────────── */

const HOW_TO_STEPS = [
  {
    num: "01",
    title: "Browse Coupons",
    desc: "Explore all available offers and find the perfect deal for your cart.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Copy Code",
    desc: "Click the copy button next to any coupon code to save it to your clipboard.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Apply at Checkout",
    desc: "Paste the code in the coupon field during checkout to unlock your discount.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Save & Enjoy",
    desc: "Complete your order and enjoy the savings. It's that simple!",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

/* ──────────────────────────── Main Page ──────────────────────────── */

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("ending");
  const [toast, setToast] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch coupons from the backend
  useEffect(() => {
    fetch("/api/coupons/available")
      .then((r) => r.json())
      .then((data) => {
        setCoupons(data.coupons ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load coupons. Please try again later.");
        setLoading(false);
      });
  }, []);

  // Filter and sort
  const filtered = coupons
    .filter((c) => {
      if (filterTab === "percentage" && c.discountType !== "percentage") return false;
      if (filterTab === "fixed" && c.discountType !== "fixed") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "ending") return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      if (sortBy === "discount") return b.discountValue - a.discountValue;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });

  const handleApply = useCallback(
    (code: string) => {
      // Copy code first, then navigate
      navigator.clipboard.writeText(code).catch(() => {});
      setToast(`Coupon "${code}" copied! Redirecting to checkout…`);
      setTimeout(() => {
        setToast(null);
        router.push("/checkout");
      }, 1500);
    },
    [router],
  );

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Offers" },
    { key: "percentage", label: "% Off" },
    { key: "fixed", label: "Flat ₹ Off" },
  ];

  const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: "ending", label: "Ending Soon" },
    { key: "discount", label: "Best Discount" },
    { key: "newest", label: "Newest" },
  ];

  /* ──────── Loading State ──────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-[#1a211e] rounded-full"
            style={{ borderTopColor: "transparent", animation: "spin 1s linear infinite" }}
          />
          <p className="text-[14px] text-[#606562] m-0">Loading offers…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 z-[1000] bg-[#1a211e] text-white px-7 py-3 rounded text-[14px] font-semibold flex items-center gap-2"
          style={{ transform: "translateX(-50%)", animation: "fadeIn 0.2s ease", letterSpacing: "0.02em" }}
        >
          <CheckIcon /> {toast}
        </div>
      )}

      <div className="min-h-screen bg-white text-[#1a211e]" style={{ fontFamily: "var(--font-geist-sans, 'Inter', sans-serif)" }}>
        {/* ═══════════ Hero Banner ═══════════ */}
        <section className="relative overflow-hidden bg-[#0c0c0c]">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, #fff 20px, #fff 21px)`,
          }} />

          <div className="relative max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <ScissorsIcon />
                  </div>
                  <span
                    className="text-white/40 text-[12px] font-bold uppercase"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    Exclusive Deals
                  </span>
                </div>
                <h1
                  className="display-serif text-white m-0 mb-3"
                  style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
                >
                  Coupons & Offers
                </h1>
                <p className="text-white/50 text-[16px] m-0 max-w-[520px] leading-relaxed">
                  Save big on your next order. Browse our curated collection of deals, copy the code, and apply at checkout.
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-[32px] font-extrabold text-white leading-none mb-1">
                    {coupons.length}
                  </div>
                  <div className="text-[11px] text-white/40 font-bold uppercase" style={{ letterSpacing: "0.08em" }}>
                    Active Offers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[32px] font-extrabold text-white leading-none mb-1">
                    {coupons.filter((c) => c.discountType === "percentage" && c.discountValue >= 20).length +
                      coupons.filter((c) => c.discountType === "fixed" && c.discountValue >= 200).length}
                  </div>
                  <div className="text-[11px] text-white/40 font-bold uppercase" style={{ letterSpacing: "0.08em" }}>
                    Top Deals
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ Search + Filter Bar ═══════════ */}
        <section className="sticky top-0 z-40 bg-white border-b border-[#e0e0e0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-[400px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search coupons…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-[40px] pl-9 pr-4 rounded bg-[#eef1f0] border border-transparent text-[14px] text-[#1a211e] outline-none placeholder:text-[#606562]/60 focus:border-[#1a211e] transition-colors"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-[#eef1f0] rounded p-0.5">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key)}
                    className="px-4 py-2 rounded text-[12px] font-bold uppercase border-none cursor-pointer transition-all duration-200"
                    style={{
                      letterSpacing: "0.038em",
                      background: filterTab === tab.key ? "#1a211e" : "transparent",
                      color: filterTab === tab.key ? "#fff" : "#606562",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-[40px] px-3 rounded border border-[#cccfcd] bg-white text-[13px] text-[#1a211e] outline-none cursor-pointer"
                style={{ fontFamily: "inherit" }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ═══════════ Coupon Grid ═══════════ */}
        <section className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-14">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[13px] text-[#606562] m-0">
              Showing <strong className="text-[#1a211e]">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "coupon" : "coupons"}
              {search && (
                <span>
                  {" "}for &ldquo;<span className="text-[#1a211e] font-medium">{search}</span>&rdquo;
                </span>
              )}
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                className="text-[12px] text-[#606562] underline cursor-pointer border-none bg-transparent"
              >
                Clear search
              </button>
            )}
          </div>

          {error && (
            <div className="text-center py-16">
              <p className="text-[#cc2e39] text-[15px] m-0 mb-4">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetch("/api/coupons/available")
                    .then((r) => r.json())
                    .then((data) => {
                      setCoupons(data.coupons ?? []);
                      setLoading(false);
                    })
                    .catch(() => {
                      setError("Failed to load coupons.");
                      setLoading(false);
                    });
                }}
                className="px-6 py-2.5 bg-[#1a211e] text-white text-[13px] font-bold uppercase rounded border-none cursor-pointer"
                style={{ letterSpacing: "0.057em" }}
              >
                Try Again
              </button>
            </div>
          )}

          {!error && filtered.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center">
              <EmptyBoxIcon />
              <h3 className="text-[20px] font-bold text-[#1a211e] mt-6 mb-2">
                {search ? "No matching coupons" : "No coupons available right now"}
              </h3>
              <p className="text-[14px] text-[#606562] m-0 max-w-[360px]">
                {search
                  ? `We couldn't find any coupons matching "${search}". Try a different search term.`
                  : "Check back soon — new deals are added regularly. In the meantime, explore our products!"}
              </p>
              {!search && (
                <button
                  onClick={() => router.push("/products")}
                  className="mt-6 px-6 py-2.5 bg-[#1a211e] text-white text-[13px] font-bold uppercase rounded border-none cursor-pointer transition-opacity hover:opacity-85"
                  style={{ letterSpacing: "0.057em" }}
                >
                  Browse Products
                </button>
              )}
            </div>
          )}

          {!error && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((coupon, i) => (
                <div key={coupon.id} style={{ animationDelay: `${i * 60}ms` }}>
                  <CouponCard coupon={coupon} onApply={() => handleApply(coupon.code)} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══════════ Divider ═══════════ */}
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="h-px bg-[#e0e0e0]" />
        </div>

        {/* ═══════════ How to Use Section ═══════════ */}
        <section className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2
              className="display-serif text-[#1a211e] m-0 mb-3"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              How to use coupons
            </h2>
            <p className="text-[15px] text-[#606562] m-0 max-w-[460px] mx-auto leading-relaxed">
              Saving on B2World is effortless. Follow these four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_TO_STEPS.map((step, idx) => (
              <div
                key={step.num}
                className="relative bg-[#eef1f0] rounded-lg p-6 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                style={{ animation: `fadeSlideIn 0.4s ease ${idx * 100}ms both` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-[32px] font-extrabold text-[#e0e0e0] leading-none"
                    style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                  >
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {step.icon}
                  </div>
                </div>
                <h4 className="text-[15px] font-bold text-[#1a211e] m-0 mb-2">{step.title}</h4>
                <p className="text-[13px] text-[#606562] m-0 leading-relaxed">{step.desc}</p>

                {/* Connector arrow (not on last) */}
                {idx < HOW_TO_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#e0e0e0] items-center justify-center z-10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#606562" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ CTA Banner ═══════════ */}
        <section className="bg-[#0c0c0c] py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 text-center">
            <h2
              className="display-serif text-white m-0 mb-4"
              style={{ fontSize: "clamp(28px, 3vw, 40px)" }}
            >
              Don&apos;t miss out on savings
            </h2>
            <p className="text-white/50 text-[15px] m-0 mb-8 max-w-[420px] mx-auto leading-relaxed">
              Start shopping with our latest coupons and enjoy exclusive discounts on everything you love.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => router.push("/products")}
                className="h-12 px-8 bg-white text-[#1a211e] border-none rounded text-[13px] font-bold uppercase cursor-pointer hover:opacity-90 transition-opacity"
                style={{ letterSpacing: "0.057em" }}
              >
                Shop Now
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => searchRef.current?.focus(), 500);
                }}
                className="h-12 px-8 bg-transparent text-white border border-white/30 rounded text-[13px] font-bold uppercase cursor-pointer hover:bg-white/10 transition-colors"
                style={{ letterSpacing: "0.057em" }}
              >
                Browse Coupons
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
