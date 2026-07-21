"use client";
import { useEffect, useState } from "react";

export default function ReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const load = () => {
    Promise.all([
      fetch("/api/seller/reviews").then(r => r.json()),
      fetch("/api/seller/reviews/analytics").then(r => r.json()),
    ]).then(([d, a]) => { setData(d); setAnalytics(a); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleReply = async (id: string) => {
    const reply = replyText[id];
    if (!reply) return;
    await fetch(`/api/seller/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setReplyText(prev => ({ ...prev, [id]: "" }));
    load();
  };

  const handleFlag = async (id: string) => {
    await fetch(`/api/seller/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag: true, flagReason: "Inappropriate" }),
    });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { reviews = [], storeRating } = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reviews & Ratings</h1>

      {/* Analytics Cards */}
      {analytics && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs text-purple-600 mb-1">Total Reviews</p>
              <p className="text-2xl font-bold text-purple-700">{analytics.totalReviews}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-blue-700">{analytics.avgRating?.toFixed(1)} <span className="text-sm font-normal">/ 5</span></p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 mb-1">Replied</p>
              <p className="text-2xl font-bold text-green-700">{analytics.repliedCount}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-xs text-yellow-600 mb-1">Pending Reply</p>
              <p className="text-2xl font-bold text-yellow-700">{analytics.pendingReplyCount}</p>
            </div>
          </div>
          {analytics.flaggedCount > 0 && (
            <div className="bg-red-50 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-sm text-red-700"><strong>{analytics.flaggedCount}</strong> review(s) flagged as inappropriate</p>
            </div>
          )}
          {/* Rating Distribution */}
          {analytics.distribution?.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const item = analytics.distribution.find((d: any) => d.rating === star);
                  const count = item?.count ?? 0;
                  const pct = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-gray-500 text-right">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-3">
        <h2 className="text-lg font-semibold text-gray-800">All Reviews</h2>
        {storeRating && (
          <span className="text-sm text-gray-400">Store rating: {storeRating.average?.toFixed(1)} ★ ({storeRating.count} reviews)</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No reviews yet</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                {r.isFlagged && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">Flagged</span>}
              </div>
              {r.comment && <p className="text-sm text-gray-700 mb-2">{r.comment}</p>}
              {r.sellerReply && <div className="ml-4 pl-3 border-l-2 border-purple-200 mt-2"><p className="text-xs text-purple-600 font-medium">Your reply:</p><p className="text-sm text-gray-600">{r.sellerReply}</p></div>}
              {!r.sellerReply && (
                <div className="flex gap-2 mt-2">
                  <input value={replyText[r.id] || ""} onChange={e => setReplyText(prev => ({ ...prev, [r.id]: e.target.value }))} placeholder="Write a reply..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  <button onClick={() => handleReply(r.id)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs">Reply</button>
                  {!r.isFlagged && <button onClick={() => handleFlag(r.id)} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg">Flag</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
