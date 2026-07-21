
"use client";
import { useEffect, useState } from "react";

const ALL_STEPS = [
  { status: "confirmed",        label: "Order Confirmed"  },
  { status: "processed",        label: "Processed"        },
  { status: "picked_up",        label: "Picked Up"        },
  { status: "shipped",          label: "Shipped"          },
  { status: "hub",              label: "Reached Hub"      },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered",        label: "Delivered"        },
];

const PREV_STATUS: Record<string, string> = {
  confirmed:        "pending",
  processed:        "confirmed",
  picked_up:        "processed",
  shipped:          "picked_up",
  hub:              "shipped",
  out_for_delivery: "hub",
  delivered:        "out_for_delivery",
};

const NEXT_STATUS: Record<string, string> = {
  pending:          "confirmed",
  confirmed:        "processed",
  processed:        "picked_up",
  picked_up:        "shipped",
  shipped:          "hub",
  hub:              "out_for_delivery",
  out_for_delivery: "delivered",
};

const STATUS_LABEL: Record<string, string> = {
  pending:          "Pending",
  confirmed:        "Order Confirmed",
  processed:        "Processed",
  picked_up:        "Picked Up",
  shipped:          "Shipped",
  hub:              "Reached Hub",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:          { bg: "#fff8e1", color: "#f57f17" },
  confirmed:        { bg: "#e3f2fd", color: "#1565c0" },
  processed:        { bg: "#e8eaf6", color: "#283593" },
  picked_up:        { bg: "#f3e5f5", color: "#6a1b9a" },
  shipped:          { bg: "#e0f7fa", color: "#00695c" },
  hub:              { bg: "#fce4ec", color: "#880e4f" },
  out_for_delivery: { bg: "#fff3e0", color: "#e65100" },
  delivered:        { bg: "#e8f5e9", color: "#1b5e20" },
};

const b2w = {
  teal: "#1a211e", green: "#10b981", red: "#ef4444",
  navy: "#1a211e", muted: "#94a3b8", border: "#e0e0e0",
  bg: "#f8f9f8", white: "#ffffff", cardShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // orderId currently being updated

  const load = () =>
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); });

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string, isUndo = false) => {
    setBusy(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, undo: isUndo }),
    });
    await load();
    setBusy(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: b2w.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${b2w.border}`, borderTopColor: b2w.teal, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: b2w.muted, margin: 0 }}>Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div style={{ color: b2w.navy }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Orders</h1>
          <p className="text-sm text-b2w-muted mt-0.5">{orders.length} total orders</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {orders.length === 0 && (
          <div style={{ background: b2w.white, borderRadius: 12, boxShadow: b2w.cardShadow, padding: 48, textAlign: "center", color: b2w.muted }}>
            No orders yet.
          </div>
        )}

        {orders.map(order => {
          const p = order.productId;
          const next = NEXT_STATUS[order.status];
          const prev = PREV_STATUS[order.status];
          const sc = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending;
          const isExpanded = expanded === order._id;
          const isBusy = busy === order._id;

          const eventMap: Record<string, any> = {};
          (order.trackingEvents || []).forEach((e: any) => { eventMap[e.status] = e; });

          // index of current status in ALL_STEPS (-1 if pending)
          const currentIdx = ALL_STEPS.findIndex(s => s.status === order.status);

          return (
            <div key={order._id} style={{ background: b2w.white, borderRadius: 12, boxShadow: b2w.cardShadow, overflow: "hidden" }}>

              {/* ── Main row ── */}
              <div style={{ padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>

                {/* Image */}
                <div style={{ width: 64, height: 64, flexShrink: 0, border: `1px solid ${b2w.border}`, borderRadius: 4, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {p?.image
                    ? <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontSize: 14 }}>Product</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: 14, color: b2w.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p?.name ?? "Product"}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: b2w.muted }}>
                    {order.address?.fullName} | {order.address?.city} | Qty: {order.quantity}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: b2w.muted }}>
                    ₹{order.totalAmount?.toLocaleString("en-IN")} | {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  {order.trackingNumber && order.courierName && (
                    <p style={{ margin: 0, fontSize: 11, color: b2w.teal }}>
                      {order.courierName}: {order.trackingNumber}
                      {order.shippingLabelUrl && (
                        <> | <a href={order.shippingLabelUrl} target="_blank" rel="noopener noreferrer" style={{ color: b2w.teal, fontWeight: 600 }}>Label</a></>
                      )}
                      {order.invoiceUrl && (
                        <> | <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: b2w.teal, fontWeight: 600 }}>Invoice</a></>
                      )}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Undo button — only if not pending */}
                    {prev && order.status !== "pending" && (
                      <button
                        onClick={() => updateStatus(order._id, prev, true)}
                        disabled={isBusy}
                        title={`Undo back to: ${STATUS_LABEL[prev]}`}
                        style={{ background: b2w.white, color: b2w.red, border: `1px solid ${b2w.red}`, padding: "7px 12px", borderRadius: 4, cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, opacity: isBusy ? 0.5 : 1, whiteSpace: "nowrap" }}>
                        ↩ Undo
                      </button>
                    )}

                    {/* Advance button */}
                    {next && order.status !== "delivered" && (
                      <button
                        onClick={() => updateStatus(order._id, next)}
                        disabled={isBusy}
                        style={{ background: "#1a211e", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 4, cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, opacity: isBusy ? 0.5 : 1, whiteSpace: "nowrap" }}>
                        {isBusy ? "Updating..." : `Mark: ${STATUS_LABEL[next]} →`}
                      </button>
                    )}

                    {/* Timeline toggle */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order._id)}
                      style={{ background: "none", border: `1px solid ${b2w.border}`, color: b2w.muted, padding: "7px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      {isExpanded ? "Hide ▲" : "Timeline ▼"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Expandable timeline with per-step mark buttons ── */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${b2w.border}`, padding: "16px 20px 20px", background: "#f8fafc" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: b2w.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Tracking Timeline - click any step to jump to it
                  </p>

                  {ALL_STEPS.map((step, i) => {
                    const event = eventMap[step.status];
                    const done = !!event;
                    const isCurrent = step.status === order.status;
                    const isLast = i === ALL_STEPS.length - 1;

                    // Can mark this step directly if it's the next undone step
                    const canMark = !done && i === currentIdx + 1;
                    // Can undo this step if it's the latest done step
                    const canUndo = done && i === currentIdx;

                    return (
                      <div key={step.status} style={{ display: "flex", gap: 12, position: "relative", alignItems: "flex-start" }}>

                        {/* Connector line */}
                        {!isLast && (
                          <div style={{ position: "absolute", left: 10, top: 26, width: 2, height: "calc(100% - 6px)", background: done ? b2w.green : b2w.border }} />
                        )}

                        {/* Dot */}
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1, marginTop: 3,
                          background: done ? b2w.green : isCurrent ? "#fff" : "#f5f5f5",
                          border: `2px solid ${done ? b2w.green : isCurrent ? b2w.teal : b2w.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Done</span>}
                        </div>

                        {/* Content + action */}
                        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: done ? b2w.navy : "#bdbdbd" }}>
                              {step.label}
                            </p>
                            {done && event && (
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: b2w.muted }}>
                                {new Date(event.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                | {event.description}
                              </p>
                            )}
                          </div>

                          {/* Per-step action buttons */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {canMark && (
                              <button
                                onClick={() => updateStatus(order._id, step.status)}
                                disabled={isBusy}
                                style={{ background: b2w.green, color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.5 : 1 }}>
                                Mark Done
                              </button>
                            )}
                            {canUndo && (
                              <button
                                onClick={() => updateStatus(order._id, PREV_STATUS[step.status], true)}
                                disabled={isBusy}
                                style={{ background: b2w.white, color: b2w.red, border: `1px solid ${b2w.red}`, padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.5 : 1 }}>
                                ↩ Undo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
