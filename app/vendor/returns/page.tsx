"use client";
import { useEffect, useState } from "react";

const STEP_DEFS = [
  { key: "pending", label: "Return Requested" },
  { key: "under_review", label: "Return Request Under Review" },
  { key: "approved", label: "Return Approved", altKey: "rejected", altLabel: "Return Rejected" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "pickup_completed", label: "Pickup Completed" },
  { key: "in_transit", label: "Item In Transit" },
  { key: "received", label: "Item Received by Vendor" },
  { key: "inspection", label: "Quality Inspection" },
  { key: "inspection_passed", label: "Return Accepted", altKey: "inspection_failed", altLabel: "Return Rejected" },
  { key: "resolution_initiated", label: "Refund Initiated / Replacement Approved" },
  { key: "resolved", label: "Refund Completed / Replacement Delivered" },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, under_review: 1, approved: 2, rejected: 2,
  pickup_scheduled: 3, pickup_completed: 4, in_transit: 5, received: 6,
  inspection: 7, inspection_passed: 8, inspection_failed: 8,
  resolution_initiated: 9, resolved: 10,
};
const REJECTED_STATUSES = new Set(["rejected", "inspection_failed"]);

const b2w = {
  navy: "#1a211e", green: "#10b981", red: "#ef4444",
  muted: "#94a3b8", border: "#e0e0e0", bg: "#f8f9f8", white: "#ffffff",
  cardShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Small inline inputs, keyed by return id, only used at the moment they're needed
  const [pickupForm, setPickupForm] = useState<Record<string, { address: string; date: string; notes: string }>>({});
  const [transitForm, setTransitForm] = useState<Record<string, { trackingNumber: string; courier: string }>>({});
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({});
  const [refundAmounts, setRefundAmounts] = useState<Record<string, number>>({});

  const load = () =>
    fetch("/api/seller/returns").then(r => r.json()).then(d => { setReturns(d.returns || []); setLoading(false); });

  useEffect(() => { load(); }, []);

  const patch = async (id: string, body: Record<string, any>) => {
    setBusy(id);
    await fetch(`/api/seller/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setBusy(null);
  };

  const schedulePickup = async (id: string) => {
    const pf = pickupForm[id];
    if (!pf?.address || !pf?.date) return;
    setBusy(id);
    await fetch("/api/seller/returns/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId: id, pickupAddress: pf.address, pickupDate: pf.date, pickupNotes: pf.notes }),
    });
    setPickupForm(prev => ({ ...prev, [id]: { address: "", date: "", notes: "" } }));
    await load();
    setBusy(null);
  };

  if (loading) return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: `4px solid ${b2w.border}`, borderTopColor: b2w.navy, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ color: b2w.navy }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Return Requests</h1>
      <p style={{ fontSize: 13, color: b2w.muted, marginBottom: 20 }}>{returns.length} total return requests</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {returns.length === 0 && (
          <div style={{ background: b2w.white, borderRadius: 12, boxShadow: b2w.cardShadow, padding: 48, textAlign: "center", color: b2w.muted }}>
            No return requests yet.
          </div>
        )}

        {returns.map(r => {
          const isBusy = busy === r.id;
          const currentIdx = STATUS_INDEX[r.status] ?? 0;
          const isRejectedTerminal = REJECTED_STATUSES.has(r.status);

          return (
            <div key={r.id} style={{ background: b2w.white, borderRadius: 12, boxShadow: b2w.cardShadow, overflow: "hidden" }}>

              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${b2w.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{r.reason}</p>
                    {r.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: b2w.muted }}>{r.description}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {r.resolutionType && (
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: 20 }}>
                        {r.resolutionType}
                      </span>
                    )}
                    {r.refundAmount && <span style={{ fontSize: 12, color: b2w.muted }}>₹{r.refundAmount}</span>}
                  </div>
                </div>
              </div>

              {/* Stepper */}
              <div style={{ padding: "18px 20px" }}>
                {STEP_DEFS.map((step, i) => {
                  const done = i < currentIdx || (i === currentIdx && !isRejectedTerminal && r.status !== step.key ? false : i <= currentIdx);
                  const isCurrentDone = i === currentIdx;
                  const isLast = i === STEP_DEFS.length - 1;
                  const showAsRejected = isCurrentDone && isRejectedTerminal && !!step.altKey;
                  const label = showAsRejected ? step.altLabel : step.label;

                  const stepDone = i < currentIdx || (i === currentIdx);
                  const stepColor = isCurrentDone && isRejectedTerminal ? b2w.red : b2w.green;

                  return (
                    <div key={step.key} style={{ display: "flex", gap: 12, position: "relative" }}>
                      {!isLast && (
                        <div style={{ position: "absolute", left: 10, top: 26, width: 2, height: "calc(100% - 6px)", background: i < currentIdx ? b2w.green : b2w.border }} />
                      )}
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1, marginTop: 3,
                        background: stepDone ? stepColor : "#f5f5f5",
                        border: `2px solid ${stepDone ? stepColor : b2w.border}`,
                      }} />
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 22 }}>
                        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: stepDone ? b2w.navy : "#bdbdbd" }}>
                          {label}
                        </p>

                        {/* Extra detail once this step is reached */}
                        {step.key === "pickup_scheduled" && i <= currentIdx && r.pickupAddress && (
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: b2w.muted }}>
                            {r.pickupAddress} {r.pickupScheduledAt && `· ${new Date(r.pickupScheduledAt).toLocaleString("en-IN")}`}
                          </p>
                        )}
                        {step.key === "in_transit" && i <= currentIdx && r.returnTrackingNumber && (
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: b2w.muted }}>
                            {r.returnCourier ? `${r.returnCourier}: ` : ""}{r.returnTrackingNumber}
                          </p>
                        )}
                        {step.key === "inspection" && i <= currentIdx && r.inspectionNotes && (
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: b2w.muted }}>{r.inspectionNotes}</p>
                        )}

                        {/* Action panel — only rendered at the current, non-terminal step */}
                        {isCurrentDone && !isRejectedTerminal && r.status !== "resolved" && (
                          <div style={{ marginTop: 10 }}>

                            {r.status === "pending" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "review" })}
                                style={btnStyle("#fef3c7", "#92400e")}>Start Review</button>
                            )}

                            {r.status === "under_review" && (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button disabled={isBusy} onClick={() => patch(r.id, { action: "approve" })}
                                  style={btnStyle("#dcfce7", "#15803d")}>Approve</button>
                                <button disabled={isBusy} onClick={() => patch(r.id, { action: "reject", reason: "Return rejected by seller after review" })}
                                  style={btnStyle("#fee2e2", "#b91c1c")}>Reject</button>
                              </div>
                            )}

                            {r.status === "approved" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
                                <input placeholder="Pickup address" value={pickupForm[r.id]?.address || ""}
                                  onChange={e => setPickupForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], address: e.target.value, date: prev[r.id]?.date || "", notes: prev[r.id]?.notes || "" } }))}
                                  style={inputStyle} />
                                <input type="datetime-local" value={pickupForm[r.id]?.date || ""}
                                  onChange={e => setPickupForm(prev => ({ ...prev, [r.id]: { ...prev[r.id], date: e.target.value, address: prev[r.id]?.address || "", notes: prev[r.id]?.notes || "" } }))}
                                  style={inputStyle} />
                                <button disabled={isBusy} onClick={() => schedulePickup(r.id)} style={btnStyle("#ffedd5", "#c2410c")}>
                                  Confirm Pickup Schedule
                                </button>
                              </div>
                            )}

                            {r.status === "pickup_scheduled" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "pickup_completed" })}
                                style={btnStyle("#ffedd5", "#c2410c")}>Mark Pickup Completed</button>
                            )}

                            {r.status === "pickup_completed" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
                                <input placeholder="Tracking number (optional)" value={transitForm[r.id]?.trackingNumber || ""}
                                  onChange={e => setTransitForm(prev => ({ ...prev, [r.id]: { trackingNumber: e.target.value, courier: prev[r.id]?.courier || "" } }))}
                                  style={inputStyle} />
                                <input placeholder="Courier (optional)" value={transitForm[r.id]?.courier || ""}
                                  onChange={e => setTransitForm(prev => ({ ...prev, [r.id]: { courier: e.target.value, trackingNumber: prev[r.id]?.trackingNumber || "" } }))}
                                  style={inputStyle} />
                                <button disabled={isBusy}
                                  onClick={() => patch(r.id, { action: "in_transit", trackingNumber: transitForm[r.id]?.trackingNumber, courier: transitForm[r.id]?.courier })}
                                  style={btnStyle("#cffafe", "#0e7490")}>Mark In Transit</button>
                              </div>
                            )}

                            {r.status === "in_transit" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "received" })}
                                style={btnStyle("#dbeafe", "#1d4ed8")}>Mark Received</button>
                            )}

                            {r.status === "received" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "start_inspection" })}
                                style={btnStyle("#e0e7ff", "#4338ca")}>Start Quality Inspection</button>
                            )}

                            {r.status === "inspection" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
                                <input placeholder="Inspection notes (optional)" value={inspectionNotes[r.id] || ""}
                                  onChange={e => setInspectionNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                                  style={inputStyle} />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button disabled={isBusy} onClick={() => patch(r.id, { action: "inspection_result", passed: true, notes: inspectionNotes[r.id] })}
                                    style={btnStyle("#ccfbf1", "#0f766e")}>Pass — Accept</button>
                                  <button disabled={isBusy} onClick={() => patch(r.id, { action: "inspection_result", passed: false, notes: inspectionNotes[r.id] || "Item failed quality inspection" })}
                                    style={btnStyle("#fee2e2", "#b91c1c")}>Fail — Reject</button>
                                </div>
                              </div>
                            )}

                            {r.status === "inspection_passed" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "initiate_resolution" })}
                                style={btnStyle("#f3e8ff", "#7e22ce")}>
                                {r.resolutionType === "replacement" ? "Approve Replacement" : "Initiate Refund"}
                              </button>
                            )}

                            {r.status === "resolution_initiated" && r.resolutionType === "refund" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
                                <input type="number" placeholder={r.refundAmount ? `₹${r.refundAmount}` : "Refund amount"}
                                  value={refundAmounts[r.id] ?? ""}
                                  onChange={e => setRefundAmounts(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                                  style={inputStyle} />
                                <button disabled={isBusy}
                                  onClick={() => patch(r.id, { action: "complete_resolution", refundAmount: refundAmounts[r.id] || r.refundAmount || 0 })}
                                  style={btnStyle("#f3e8ff", "#7e22ce")}>Mark Refund Completed</button>
                              </div>
                            )}

                            {r.status === "resolution_initiated" && r.resolutionType === "replacement" && (
                              <button disabled={isBusy} onClick={() => patch(r.id, { action: "complete_resolution" })}
                                style={btnStyle("#f3e8ff", "#7e22ce")}>Mark Replacement Delivered</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" };
}
const inputStyle: React.CSSProperties = { padding: "6px 10px", fontSize: 12, border: "1px solid #e0e0e0", borderRadius: 6 };