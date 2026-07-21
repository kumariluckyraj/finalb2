"use client";
import { useEffect, useState, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import LanguagePicker from "@/components/LanguagePicker";

const STATUS_META: Record<string, { color: string; label: string; icon: string }> = {
  pending: { color: "#1a211e", label: "Pending", icon: "•" },
  confirmed: { color: "#1a211e", label: "Confirmed", icon: "•" },
  processed: { color: "#1a211e", label: "Processing", icon: "•" },
  picked_up: { color: "#1a211e", label: "Picked Up", icon: "•" },
  shipped: { color: "#1a211e", label: "Shipped", icon: "•" },
  hub: { color: "#1a211e", label: "At Hub", icon: "•" },
  out_for_delivery: { color: "#1a211e", label: "Out for Delivery", icon: "•" },
  delivered: { color: "#10b981", label: "Delivered", icon: "✓" },
};

const FILTERS = ["All", "Active", "Delivered"] as const;
type Filter = (typeof FILTERS)[number];

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  trueBlack: "#000000", obsidian: "#0c0c0c",
  fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", pewter: "#4e4e4e",
  emberRed: "#cc2e39",
};

const ORDERS_STRINGS = {
  pending: "Pending", confirmed: "Confirmed", processed: "Processing",
  picked_up: "Picked Up", shipped: "Shipped", hub: "At Hub",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
  filterAll: "All Orders", filterActive: "Active Orders", filterDelivered: "Delivered",
  myOrders: "My Orders", activeLabel: "active",
  orderSingular: "order", orderPlural: "orders",
  searchPlaceholder: "Search by product name, order ID, or city...",
  emptySearchTitle: "No orders match your search.",
  emptySearchSub: "Try a different keyword",
  emptyDeliveredTitle: "No delivered orders yet.",
  emptyActiveTitle: "No active orders.",
  emptyAllTitle: "You haven't placed any orders yet.",
  emptyAllSub: "Explore our products and place your first order.",
  startShopping: "Start Shopping", deliveredOn: "Delivered on ",
  defaultProduct: "Product", qtyLabel: "Qty: ",
  codPayment: "Cash on Delivery", onlinePayment: "Paid Online",
  offLabel: "off", viewDetails: "VIEW DETAILS", trackOrder: "TRACK ORDER",
};

const STEP_KEYS = ["confirmed", "processed", "picked_up", "shipped", "hub", "out_for_delivery", "delivered"];

function OrderSkeleton() {
  return (
    <div style={{ border: `1px solid ${pd.mist}`, padding: "24px", display: "flex", gap: "24px", alignItems: "center", animation: "pulse 1.4s ease-in-out infinite" }}>
      <div style={{ width: 120, height: 120, background: pd.fog, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 16, width: "30%", background: pd.fog }} />
        <div style={{ height: 14, width: "20%", background: pd.fog }} />
        <div style={{ height: 14, width: "40%", background: pd.fog }} />
      </div>
    </div>
  );
}

function MiniProgress({ status, t }: { status: string; t: (k: string) => string }) {
  const currentIdx = STEP_KEYS.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "12px" }}>
      {STEP_KEYS.map((s, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={s} title={t(s)} style={{ width: isCurrent ? 24 : 12, height: 2, background: done ? pd.carbonInk : pd.mist, transition: "all 0.3s ease" }} />
        );
      })}
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { language, translate } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const [trans, setTrans] = useState<Record<string, string>>(ORDERS_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);
  const languageRef = useRef(language);
  useEffect(() => { languageRef.current = language; }, [language]);
  const translateRef = useRef(translate);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    const calledForLang = language;
    if (calledForLang === "en") { setTrans(ORDERS_STRINGS); return; }
    if (loading) return;
    setIsTranslating(true);
    const payload: Record<string, string> = { ...ORDERS_STRINGS };
    orders.forEach(order => { if (order.productId?.name) payload[`pname_${order._id}`] = order.productId.name; });
    translateRef.current(payload, `orders_${orders.length}`)
      .then(result => { if (!mounted || languageRef.current !== calledForLang) return; setTrans({ ...ORDERS_STRINGS, ...result }); })
      .catch(() => { if (mounted) setTrans(ORDERS_STRINGS); })
      .finally(() => { if (mounted) setIsTranslating(false); });
    return () => { mounted = false; };
  }, [language, orders, loading]);

  const t = (key: string): string => trans[key] ?? (ORDERS_STRINGS as any)[key] ?? key;
  const dt = (orderId: string, fallback: string): string => trans[`pname_${orderId}`] || fallback;

  const filtered = orders.filter(order => {
    const matchesFilter = filter === "All" || (filter === "Delivered" && order.status === "delivered") || (filter === "Active" && order.status !== "delivered" && order.status !== "pending");
    const q = search.toLowerCase();
    const matchesSearch = !q || order.productId?.name?.toLowerCase().includes(q) || order._id?.toLowerCase().includes(q) || order.address?.city?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const activeCount = orders.filter(o => o.status !== "delivered" && o.status !== "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, fontFamily: "var(--font-geist, 'Inter', sans-serif)", color: pd.carbonInk, opacity: isTranslating ? 0.85 : 1, transition: "opacity 0.2s" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pd-filter-btn { transition: all 0.2s ease; outline: none; }
        .pd-filter-btn:hover { background: ${pd.obsidian}; color: ${pd.paperWhite}; border-color: ${pd.obsidian}; }
        .pd-order-card { transition: all 0.2s ease; cursor: pointer; border: 1px solid ${pd.mist}; border-top: none; }
        .pd-order-card:first-of-type { border-top: 1px solid ${pd.mist}; }
        .pd-order-card:hover { background: ${pd.fog}; }
        .pd-action-btn { transition: background 0.2s ease; }
        .pd-action-btn:hover { background: ${pd.carbonInk}; color: ${pd.paperWhite}; }
      `}</style>

      {/* Hero Header Section */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px 32px" }}>
        <p style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", fontSize: 14, letterSpacing: "0.038em", color: pd.graphite, margin: "0 0 12px", fontWeight: 700 }}>
          {t("myOrders")} / {orders.length} {orders.length !== 1 ? t("orderPlural") : t("orderSingular")}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
            {t("myOrders")}
          </h1>
          <div style={{ paddingBottom: 8 }}>
            <LanguagePicker />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
        
        {/* Filters and Search Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 48, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {FILTERS.map(f => {
              const label = f === "All" ? t("filterAll") : f === "Active" ? t("filterActive") : t("filterDelivered");
              const isActive = filter === f;
              return (
                <button key={f} className="pd-filter-btn" onClick={() => setFilter(f)} style={{ 
                  padding: "8px 20px", borderRadius: 9999, 
                  border: `1px solid ${isActive ? pd.carbonInk : pd.ashBorder}`, 
                  background: isActive ? pd.carbonInk : "transparent", 
                  color: isActive ? pd.paperWhite : pd.slate, 
                  fontWeight: 700, fontSize: 14, cursor: "pointer", 
                  fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)",
                  textTransform: "uppercase", letterSpacing: "0.038em", whiteSpace: "nowrap"
                }}>
                  {label}
                  {f === "Active" && activeCount > 0 && (
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>({activeCount})</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 400 }}>
            <input type="text" placeholder={t("searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)}
              style={{ 
                width: "100%", boxSizing: "border-box", border: `1px solid ${pd.ashBorder}`, 
                borderRadius: 4, padding: "12px 36px 12px 16px", fontSize: 14, 
                color: pd.carbonInk, outline: "none", fontFamily: "inherit", background: pd.fog 
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: pd.graphite, fontSize: 16, padding: 0 }}>✕</button>
            )}
          </div>
          <button onClick={() => router.push("/returns")} className="pd-action-btn" style={{ background: "transparent", color: pd.carbonInk, border: `1px solid ${pd.ashBorder}`, padding: "10px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={14} /> Returns
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading && <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{[1, 2, 3].map(n => <OrderSkeleton key={n} />)}</div>}

        {/* Empty States */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: "80px 24px", borderTop: `1px solid ${pd.mist}`, animation: "fadeSlideIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 40, margin: "0 0 16px", fontWeight: 400 }}>
              {search ? t("emptySearchTitle") : filter === "Delivered" ? t("emptyDeliveredTitle") : filter === "Active" ? t("emptyActiveTitle") : t("emptyAllTitle")}
            </h2>
            <p style={{ fontSize: 16, color: pd.graphite, margin: "0 0 32px" }}>
              {search ? t("emptySearchSub") : t("emptyAllSub")}
            </p>
            {!search && (
              <button onClick={() => router.push("/")} className="pd-action-btn" style={{ 
                background: "transparent", color: pd.carbonInk, border: `1px solid ${pd.carbonInk}`, 
                padding: "12px 24px", borderRadius: 4, fontWeight: 700, fontSize: 14, 
                cursor: "pointer", fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em"
              }}>
                {t("startShopping")}
              </button>
            )}
          </div>
        )}

        {/* Orders List */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map((order, idx) => {
              const product = order.productId;
              const meta = STATUS_META[order.status] ?? STATUS_META.pending;
              const statusLabel = t(order.status) || meta.label;
              const discountPct = product?.actualPrice && product?.price ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100) : 0;
              const isDelivered = order.status === "delivered";
              const deliveredEvent = order.trackingEvents?.find((e: any) => e.status === "delivered");

              return (
                <div key={order._id} className="pd-order-card" onClick={() => router.push(`/orders/${order._id}`)}
                  style={{ animation: `fadeSlideIn 0.3s ease ${idx * 0.05}s both`, display: "flex", flexDirection: "column", background: pd.paperWhite }}>
                  
                  <div style={{ padding: "32px 24px", display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                    
                    {/* Product Image */}
                    <div style={{ width: 140, height: 140, flexShrink: 0, background: pd.fog, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {product?.image
                        ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 24, color: pd.mist }}>NO IMAGE</span>
                      }
                    </div>

                    {/* Order Details */}
                    <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 14, color: pd.graphite, margin: "0 0 8px" }}>
                            ORDER #{order._id?.slice(-8).toUpperCase()}
                          </p>
                          <h3 style={{ margin: "0 0 12px", fontWeight: 400, fontSize: 24, color: pd.carbonInk, lineHeight: 1.2 }}>
                            {product ? dt(order._id, product.name) : t("defaultProduct")}
                          </h3>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span style={{ fontSize: 24, fontWeight: 400, color: pd.carbonInk }}>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: "auto" }}>
                        <div>
                          <span style={{ display: "block", fontSize: 12, textTransform: "uppercase", color: pd.graphite, marginBottom: 4 }}>Date</span>
                          <span style={{ fontSize: 14, color: pd.carbonInk }}>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <div>
                          <span style={{ display: "block", fontSize: 12, textTransform: "uppercase", color: pd.graphite, marginBottom: 4 }}>Status</span>
                          <span style={{ fontSize: 14, color: meta.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            {meta.icon} {statusLabel}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: "block", fontSize: 12, textTransform: "uppercase", color: pd.graphite, marginBottom: 4 }}>Destination</span>
                          <span style={{ fontSize: 14, color: pd.carbonInk }}>{order.address?.city}</span>
                        </div>
                      </div>

                      {!isDelivered && order.status !== "pending" && <MiniProgress status={order.status} t={t} />}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ alignSelf: "center", marginLeft: "auto", display: "flex", gap: 8 }}>
                      <button className="pd-action-btn" onClick={e => { e.stopPropagation(); router.push(`/orders/${order._id}`); }}
                        style={{ 
                          background: "transparent", color: pd.carbonInk, border: `1px solid ${pd.carbonInk}`, 
                          padding: "12px 24px", borderRadius: 4, fontSize: 14, fontWeight: 700, 
                          cursor: "pointer", fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", whiteSpace: "nowrap"
                        }}>
                        {isDelivered ? t("viewDetails") : t("trackOrder")}
                      </button>
                      {isDelivered && (
                        <button className="pd-action-btn" onClick={e => { e.stopPropagation(); router.push(`/orders/${order._id}`); }}
                          style={{ 
                            background: pd.emberRed, color: pd.paperWhite, border: `1px solid ${pd.emberRed}`, 
                            padding: "12px 24px", borderRadius: 4, fontSize: 14, fontWeight: 700, 
                            cursor: "pointer", fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", whiteSpace: "nowrap"
                          }}>
                          Return
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
