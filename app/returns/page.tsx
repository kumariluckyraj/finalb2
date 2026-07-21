"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  picked_up: "bg-blue-100 text-blue-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function UserReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/returns").then(r => r.json()).then(d => { setReturns(d.returns || []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Returns</h1>

      {returns.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="mb-2">No return requests</p>
          <Link href="/myorders" className="text-sm text-purple-600 hover:underline">View your orders</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex gap-4">
                {r.productImage && (
                  <img src={r.productImage} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-50" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{r.productName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    {r.refundAmount && <span className="text-xs text-gray-500">Refund: ₹{r.refundAmount}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                  {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">Seller: {r.sellerName}</p>

                  {/* Pickup info */}
                  {r.pickupAddress && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs">
                      <p className="text-blue-700 font-medium">Pickup: {r.pickupAddress}</p>
                      {r.pickupScheduledAt && <p className="text-blue-600">{new Date(r.pickupScheduledAt).toLocaleString()}</p>}
                    </div>
                  )}

                  {/* Timeline */}
                  {r.timeline?.length > 0 && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className="mt-2 text-xs text-purple-600 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      {expanded[r.id] ? "Hide" : "Show"} timeline
                    </button>
                  )}
                  {expanded[r.id] && r.timeline?.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {r.timeline.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                          <span className="capitalize">{t.status}</span>
                          <span>{new Date(t.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
