"use client";
import { useEffect, useState } from "react";

export default function AdminMessagesPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [mode, setMode] = useState<"single" | "broadcast">("broadcast");
  const [form, setForm] = useState({ sellerId: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);

  const loadBroadcasts = () => {
    fetch("/api/admin/messages/broadcast")
      .then(r => r.json())
      .then(d => { setBroadcasts(d.broadcasts || []); setLoadingBroadcasts(false); });
  };

  const loadInbox = () => {
    fetch("/api/admin/messages")
      .then(r => r.json())
      .then(d => { setInbox(d.messages || []); setLoadingInbox(false); });
  };

  useEffect(() => { loadBroadcasts(); loadInbox(); }, []);

  const send = async () => {
    if (!form.subject || !form.body) return;
    if (mode === "single" && !form.sellerId) return;
    setSending(true);

    const url = mode === "broadcast" ? "/api/admin/messages/broadcast" : "/api/admin/messages";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ sellerId: "", subject: "", body: "" });
    setSending(false);
    if (mode === "broadcast") loadBroadcasts();
  };

  const markRead = async (id: string) => {
    await fetch(`/api/admin/messages/${id}/read`, { method: "PATCH" });
    loadInbox();
  };

  const unreadCount = inbox.filter((m: any) => !m.isRead).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-b2w-navy mb-6">Seller Messaging</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode("broadcast")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer ${mode === "broadcast" ? "bg-b2w-brand text-white" : "bg-b2w-bg text-b2w-muted"}`}
            >
              Broadcast to All
            </button>
            <button
              onClick={() => setMode("single")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer ${mode === "single" ? "bg-b2w-brand text-white" : "bg-b2w-bg text-b2w-muted"}`}
            >
              Single Seller
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 border border-b2w-border space-y-3">
            {mode === "single" && (
              <input
                value={form.sellerId}
                onChange={e => setForm(prev => ({ ...prev, sellerId: e.target.value }))}
                placeholder="Seller ID"
                className="w-full px-3 py-2.5 border border-b2w-border rounded-xl text-sm"
              />
            )}
            <input
              value={form.subject}
              onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
              className="w-full px-3 py-2.5 border border-b2w-border rounded-xl text-sm"
            />
            <textarea
              value={form.body}
              onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
              rows={4}
              placeholder="Message"
              className="w-full px-3 py-2.5 border border-b2w-border rounded-xl text-sm"
            />
            <button
              onClick={send}
              disabled={sending}
              className="px-4 py-2 bg-b2w-brand text-white rounded-xl text-sm font-semibold hover:bg-b2w-brand/90 transition border-none cursor-pointer disabled:opacity-50"
            >
              {sending ? "Sending..." : mode === "broadcast" ? "Send to All Sellers" : "Send"}
            </button>
          </div>

          <h2 className="font-semibold text-b2w-navy mb-3 mt-6">Broadcast History</h2>
          {loadingBroadcasts ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-2 border-b2w-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-8 text-b2w-muted bg-white rounded-xl border border-b2w-border text-sm">No broadcasts yet</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {broadcasts.map((b: any) => (
                <div key={b.broadcastId} className="bg-white rounded-xl p-3 border border-b2w-border text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-b2w-navy">{b.subject}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-b2w-bg text-b2w-brand">
                      {b.recipientCount} recipients
                    </span>
                  </div>
                  <p className="text-b2w-body whitespace-pre-wrap">{b.body}</p>
                  <p className="text-xs text-b2w-muted mt-1">{new Date(b.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-b2w-navy">Seller Inbox</h2>
            {unreadCount > 0 && <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">{unreadCount} unread</span>}
          </div>
          {loadingInbox ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-2 border-b2w-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-8 text-b2w-muted bg-white rounded-xl border border-b2w-border text-sm">No messages from sellers</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {inbox.map((m: any) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl p-3 border text-sm cursor-pointer ${!m.isRead ? "border-b2w-brand/30 bg-b2w-bg" : "border-b2w-border"}`}
                  onClick={() => { if (!m.isRead) markRead(m.id); }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-b2w-navy">{m.subject}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                      {m.sellerName || m.sellerId}
                    </span>
                  </div>
                  <p className="text-b2w-body whitespace-pre-wrap">{m.body}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-b2w-muted">{new Date(m.createdAt).toLocaleString()}</p>
                    {!m.isRead && <span className="w-2 h-2 bg-b2w-brand rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}