"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function UserReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/returns").then(r => r.json()).then(d => { setReturns(d.returns || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Returns</h1>

      {returns.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="mb-2">No return requests</p>
          <Link href="/myorders" className="text-sm text-purple-600 hover:underline">View your orders</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map(r => {
            const currentIdx = STATUS_INDEX[r.status] ?? 0;
            const isRejectedTerminal = REJECTED_STATUSES.has(r.status);

            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-3">
                  {r.productImage && <img src={r.productImage} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-50" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{r.productName}</span>
                      {r.resolutionType && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{r.resolutionType}</span>
                      )}
                      {r.refundAmount && <span className="text-xs text-gray-500">₹{r.refundAmount}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{r.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Seller: {r.sellerName}</p>
                  </div>
                </div>

                <div className="p-4">
                  {STEP_DEFS.map((step, i) => {
                    const stepDone = i <= currentIdx;
                    const isCurrentDone = i === currentIdx;
                    const isLast = i === STEP_DEFS.length - 1;
                    const showAsRejected = isCurrentDone && isRejectedTerminal && !!step.altKey;
                    const label = showAsRejected ? step.altLabel : step.label;
                    const dotColor = isCurrentDone && isRejectedTerminal ? "#ef4444" : "#10b981";

                    return (
                      <div key={step.key} className="flex gap-3 relative">
                        {!isLast && (
                          <div className="absolute left-[10px] top-[26px]" style={{ width: 2, height: "calc(100% - 6px)", background: i < currentIdx ? "#10b981" : "#e0e0e0" }} />
                        )}
                        <div className="w-[22px] h-[22px] rounded-full flex-shrink-0 mt-[3px] z-10"
                          style={{ background: stepDone ? dotColor : "#f5f5f5", border: `2px solid ${stepDone ? dotColor : "#e0e0e0"}` }} />
                        <div className={`flex-1 ${isLast ? "" : "pb-[22px]"}`}>
                          <p className={`text-sm font-semibold ${stepDone ? "text-gray-800" : "text-gray-300"}`}>{label}</p>

                          {step.key === "pickup_scheduled" && i <= currentIdx && r.pickupAddress && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {r.pickupAddress} {r.pickupScheduledAt && `· ${new Date(r.pickupScheduledAt).toLocaleString()}`}
                            </p>
                          )}
                          {step.key === "in_transit" && i <= currentIdx && r.returnTrackingNumber && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {r.returnCourier ? `${r.returnCourier}: ` : ""}{r.returnTrackingNumber}
                            </p>
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
      )}
    </div>
  );
}