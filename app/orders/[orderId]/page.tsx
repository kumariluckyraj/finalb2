"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const ALL_STEPS = [
  { status: "confirmed", label: "Order Confirmed" },
  { status: "processed", label: "Order Processed" },
  { status: "picked_up", label: "Picked Up" },
  { status: "shipped", label: "Shipped" },
  { status: "hub", label: "Reached Hub" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

const pd = {
  carbonInk: "#1a211e", paperWhite: "#ffffff",
  obsidian: "#0c0c0c", fog: "#eef1f0", mist: "#e0e0e0",
  graphite: "#606562", ashBorder: "#cccfcd",
  slate: "#363537", emberRed: "#cc2e39", success: "#10b981"
};

const POLL_INTERVAL_MS = 8000;

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");

  const orderIdRef = useRef(orderId);
  useEffect(() => { orderIdRef.current = orderId; }, [orderId]);

  const fetchOrder = async (showSpinner = false) => {
    if (!orderIdRef.current) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderIdRef.current}`, {
        cache: "no-store", headers: { "Cache-Control": "no-cache" },
      });
      const d = await res.json();
      setOrder(d.order ?? null);
      setLastUpdated(new Date());
    } catch {
      console.warn("Background order poll failed");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(true); }, [orderId]);

  useEffect(() => {
    if (order?.status === "delivered") return;
    const interval = setInterval(() => fetchOrder(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [order?.status]);

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === "visible") fetchOrder(false); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${pd.carbonInk}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-geist, 'Inter', sans-serif)" }}>
      <div style={{ textAlign: "center", padding: 48, border: `1px solid ${pd.mist}` }}>
        <p style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 32, color: pd.carbonInk, margin: "0 0 24px" }}>Order not found</p>
        <button onClick={() => router.push("/")} style={{ background: pd.carbonInk, color: pd.paperWhite, border: "none", padding: "12px 24px", fontWeight: 700, fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", cursor: "pointer" }}>
          Go Home
        </button>
      </div>
    </div>
  );

  const product = order.productId;
  const eventMap: Record<string, any> = {};
  (order.trackingEvents || []).forEach((e: any) => { eventMap[e.status?.toLowerCase() || e.status] = e; });
  const currentStepIndex = ALL_STEPS.findIndex(s => s.status === order.status?.toLowerCase());
  const discountPct = product?.actualPrice && product?.price ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100) : 0;
  const hasTracking = order.trackingNumber && order.courierName;

  return (
    <div style={{ minHeight: "100vh", background: pd.paperWhite, fontFamily: "var(--font-geist, 'Inter', sans-serif)", color: pd.carbonInk }}>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pd-btn {
          background: ${pd.carbonInk}; color: ${pd.paperWhite}; border: none;
          padding: 12px 24px; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: opacity 0.2s;
        }
        .pd-btn:hover { opacity: 0.85; }
        .pd-btn-outline {
          background: transparent; color: ${pd.carbonInk}; border: 1px solid ${pd.carbonInk};
          padding: 8px 16px; font-weight: 700; font-size: 12px;
          cursor: pointer; font-family: var(--font-bryant-style-condensed-sans-bryant, sans-serif);
          text-transform: uppercase; letter-spacing: 0.038em; transition: background 0.2s;
        }
        .pd-btn-outline:hover { background: ${pd.fog}; }
        .pd-card {
          border: 1px solid ${pd.mist}; background: ${pd.paperWhite};
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px" }}>

        {/* Breadcrumbs */}
        <div style={{ marginBottom: 48 }}>
          <button onClick={() => router.push("/myorders")} style={{ background: "transparent", border: "none", color: pd.graphite, padding: 0, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            ← Back to My Orders
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 48, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontStyle: "italic", fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontWeight: 400 }}>
              Order Details
            </h1>
            <p style={{ margin: "16px 0 0", color: pd.graphite, fontSize: 16 }}>
              Order #{orderId?.slice(-8).toUpperCase()} • Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {lastUpdated && order.status !== "delivered" && (
            <div style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", fontSize: 12, color: pd.graphite, fontWeight: 700 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: pd.success, marginRight: 8, animation: "pulse 2s infinite" }}></span>
              Live • Updated {lastUpdated.toLocaleTimeString("en-IN", { timeStyle: "short" })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, animation: "fadeSlideIn 0.3s ease" }}>

          {/* Main Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Product Card */}
            <div className="pd-card">
              <div style={{ padding: "32px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div
                  onClick={() => router.push(`/product/${product?._id}`)}
                  style={{ width: 120, height: 120, background: pd.fog, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {product?.image ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.057em", fontSize: 11, color: pd.graphite, marginBottom: 8, fontWeight: 700 }}>
                    {order.status}
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 400, color: pd.carbonInk }}>{product?.name ?? "Product"}</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: pd.graphite }}>Qty: {order.quantity} • {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}</p>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 24, color: pd.carbonInk }}>₹{order.totalAmount?.toLocaleString("en-IN") ?? product?.price?.toLocaleString("en-IN")}</span>
                    {product?.actualPrice && (
                      <span style={{ fontSize: 14, color: pd.ashBorder, textDecoration: "line-through" }}>
                        ₹{(product.actualPrice * order.quantity)?.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="pd-btn-outline" onClick={() => router.push(`/product/${product?._id}`)}>
                    View Item
                  </button>
                  {order.status?.toLowerCase() === "delivered" && (
                    <button
                      className="pd-btn"
                      onClick={() => { setReturnReason(""); setReturnDescription(""); setReturnError(""); setShowReturnModal(true); }}
                      style={{ background: pd.emberRed, color: pd.paperWhite, borderColor: pd.emberRed }}
                    >
                      Return Item
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="pd-card" style={{ padding: 32 }}>
              <h3 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 24, margin: "0 0 32px", fontWeight: 400 }}>
                Shipment Tracking
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {ALL_STEPS.map((step, i) => {
                  const event = eventMap[step.status];
                  const done = !!event;
                  const isActive = !done && i === currentStepIndex + 1;
                  const isLast = i === ALL_STEPS.length - 1;

                  return (
                    <div key={step.status} style={{ display: "flex", gap: 24, position: "relative" }}>
                      {!isLast && (
                        <div style={{ position: "absolute", left: 7, top: 24, width: 2, height: "calc(100% - 8px)", background: done ? pd.carbonInk : pd.mist }} />
                      )}

                      <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, zIndex: 1, marginTop: 4, background: done ? pd.carbonInk : pd.paperWhite, border: `2px solid ${done ? pd.carbonInk : isActive ? pd.carbonInk : pd.mist}` }} />

                      <div style={{ paddingBottom: isLast ? 0 : 40, flex: 1 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: done || isActive ? 600 : 400, color: done ? pd.carbonInk : isActive ? pd.carbonInk : pd.graphite }}>
                          {step.label}
                        </p>
                        {done && event && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ margin: "0 0 4px", fontSize: 13, color: pd.graphite, fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.038em", fontWeight: 700 }}>
                              {new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                            <p style={{ margin: 0, fontSize: 14, color: pd.carbonInk, lineHeight: 1.5 }}>{event.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Courier Info */}
            {hasTracking && (
              <div className="pd-card" style={{ padding: 32 }}>
                <h3 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 24, margin: "0 0 24px", fontWeight: 400 }}>
                  Shipping Info
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.057em", fontSize: 11, color: pd.graphite, marginBottom: 4, fontWeight: 700 }}>Courier</div>
                    <div style={{ fontSize: 16 }}>{order.courierName}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)", textTransform: "uppercase", letterSpacing: "0.057em", fontSize: 11, color: pd.graphite, marginBottom: 4, fontWeight: 700 }}>Tracking Number</div>
                    <div style={{ fontSize: 16 }}>{order.trackingNumber}</div>
                  </div>
                  {(order.shippingLabelUrl || order.invoiceUrl) && (
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      {order.shippingLabelUrl && <a href={order.shippingLabelUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: pd.carbonInk, textDecoration: "underline", textUnderlineOffset: 4 }}>Label</a>}
                      {order.invoiceUrl && <a href={order.invoiceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: pd.carbonInk, textDecoration: "underline", textUnderlineOffset: 4 }}>Invoice</a>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="pd-card" style={{ padding: 32 }}>
              <h3 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 24, margin: "0 0 24px", fontWeight: 400 }}>
                Delivery Address
              </h3>
              <div style={{ fontSize: 14, color: pd.carbonInk, lineHeight: 1.6 }}>
                <strong>{order.address?.fullName}</strong><br />
                {order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ""}<br />
                {order.address?.city}, {order.address?.state} - {order.address?.pincode}<br />
                <span style={{ color: pd.graphite }}>Phone: {order.address?.phone}</span>
              </div>
            </div>

            {/* Price Details */}
            <div className="pd-card" style={{ padding: 32 }}>
              <h3 style={{ fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)", fontSize: 24, margin: "0 0 24px", fontWeight: 400 }}>
                Summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: pd.graphite }}>Subtotal ({order.quantity} items)</span>
                  <span>₹{(product?.price * order.quantity)?.toLocaleString("en-IN") ?? "-"}</span>
                </div>
                {discountPct > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: pd.graphite }}>Discount</span>
                    <span>-₹{((product.actualPrice - product.price) * order.quantity)?.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, borderBottom: `1px solid ${pd.mist}`, paddingBottom: 16 }}>
                  <span style={{ color: pd.graphite }}>Delivery</span>
                  <span>{order.totalAmount >= 499 ? "FREE" : "₹49"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                  <span>Total</span>
                  <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
        }} onClick={() => setShowReturnModal(false)}>
          <div style={{
            background: pd.paperWhite, maxWidth: 480, width: "90%",
            padding: 40, position: "relative", animation: "fadeSlideIn 0.2s ease",
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReturnModal(false)} style={{
              position: "absolute", top: 16, right: 16, background: "transparent",
              border: "none", fontSize: 20, cursor: "pointer", color: pd.graphite,
              lineHeight: 1, padding: 4,
            }}>✕</button>

            <h2 style={{
              fontFamily: "var(--font-exposure-style-serif-exposure-10, 'Playfair Display', serif)",
              fontSize: 28, fontWeight: 400, margin: "0 0 8px",
            }}>Return Item</h2>
            <p style={{ margin: "0 0 24px", color: pd.graphite, fontSize: 14 }}>
              {product?.name ?? "Product"} — Qty: {order.quantity}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8,
                fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)",
                textTransform: "uppercase", letterSpacing: "0.057em",
              }}>
                Reason for Return *
              </label>
              <select value={returnReason} onChange={e => setReturnReason(e.target.value)} style={{
                width: "100%", padding: "12px 16px", border: `1px solid ${pd.ashBorder}`,
                fontSize: 14, background: pd.paperWhite, color: pd.carbonInk, borderRadius: 0,
                fontFamily: "inherit", cursor: "pointer",
              }}>
                <option value="">Select a reason</option>
                <option value="defective">Defective / Damaged</option>
                <option value="wrong_item">Wrong item shipped</option>
                <option value="size_issue">Size / Fit issue</option>
                <option value="quality">Quality not as expected</option>
                <option value="look_different">Looks different from image</option>
                <option value="delayed">Delayed delivery</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8,
                fontFamily: "var(--font-bryant-style-condensed-sans-bryant, sans-serif)",
                textTransform: "uppercase", letterSpacing: "0.057em",
              }}>
                Description (optional)
              </label>
              <textarea value={returnDescription} onChange={e => setReturnDescription(e.target.value)} rows={3} placeholder="Tell us more about the issue..." style={{
                width: "100%", padding: "12px 16px", border: `1px solid ${pd.ashBorder}`,
                fontSize: 14, fontFamily: "inherit", resize: "vertical", borderRadius: 0,
                color: pd.carbonInk,
              }} />
            </div>

            {returnError && <p style={{ color: pd.emberRed, fontSize: 13, margin: "0 0 16px" }}>{returnError}</p>}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowReturnModal(false)} className="pd-btn-outline" style={{ fontSize: 13 }}>
                Cancel
              </button>
              <button disabled={returnSubmitting || !returnReason} className="pd-btn" onClick={async () => {
                if (!returnReason) return;
                setReturnSubmitting(true);
                setReturnError("");
                try {
                  const res = await fetch("/api/returns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId, reason: returnReason, description: returnDescription || undefined }),
                  });
                  if (res.ok) {
                    setShowReturnModal(false);
                    router.push("/returns");
                  } else {
                    const err = await res.json();
                    setReturnError(err.error || "Something went wrong");
                  }
                } catch {
                  setReturnError("Network error. Please try again.");
                } finally { setReturnSubmitting(false); }
              }} style={{ fontSize: 13, background: pd.emberRed, borderColor: pd.emberRed }}>
                {returnSubmitting ? "Submitting..." : "Submit Return Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}