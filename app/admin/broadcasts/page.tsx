"use client";
import { useEffect, useState } from "react";

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/broadcasts").then(r => r.json()).then(d => { setBroadcasts(d.broadcasts || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const sendBroadcast = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const d = await res.json();
      if (d.success) {
        setResult(`Broadcast sent to ${d.sentTo} seller(s)`);
        setSubject("");
        setBody("");
        setShowForm(false);
        load();
      } else {
        setResult("Failed to send");
      }
    } catch {
      setResult("Failed to send");
    } finally {
      setSending(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Broadcasts</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue/90 transition cursor-pointer border-none">
          {showForm ? "Cancel" : "+ New Broadcast"}
        </button>
      </div>

      {result && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">{result}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Send Broadcast to All Sellers</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Important: Platform update" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" placeholder="Dear seller, ..." />
          </div>
          <button onClick={sendBroadcast} disabled={sending || !subject.trim() || !body.trim()} className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue/90 disabled:opacity-50 transition cursor-pointer border-none">
            {sending ? "Sending..." : "Send to All Sellers"}
          </button>
        </div>
      )}

      {broadcasts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No broadcasts sent yet</div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => (
            <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{b.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{b.body}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Sent: {new Date(b.createdAt).toLocaleString()}</span>
                    <span>To: {b.sentCount}/{b.targetSellerCount} sellers</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
