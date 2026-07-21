"use client";
import { useEffect, useState } from "react";

export default function MessagesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState({ subject: "", body: "" });

  const load = () => {
    fetch("/api/seller/messages").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const sendMessage = async () => {
    if (!newMsg.subject || !newMsg.body) return;
    await fetch("/api/seller/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newMsg, senderType: "seller" }),
    });
    setNewMsg({ subject: "", body: "" });
    load();
  };

  const markRead = async (id: string) => {
    await fetch(`/api/seller/messages/${id}/read`, { method: "PATCH" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>;

  const { messages = [], unreadCount } = data || {};
  const broadcasts = messages.filter((m: any) => m.broadcastId);
  const otherMessages = messages.filter((m: any) => !m.broadcastId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        {unreadCount > 0 && <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">{unreadCount} unread</span>}
      </div>

      {/* Broadcasts from Company */}
      {broadcasts.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Company Broadcasts
          </h2>
          <div className="space-y-2">
            {broadcasts.map((m: any) => (
              <div
                key={m.id}
                className={`bg-white rounded-xl p-3 border text-sm cursor-pointer ${
                  !m.isRead ? "border-blue-200 bg-blue-50" : "border-gray-100"
                }`}
                onClick={() => { if (!m.isRead) markRead(m.id); }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{m.subject}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                    {m.senderType}
                    {m.broadcastId && " — Broadcast"}
                  </span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{m.body}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</p>
                  {!m.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Send Message</h2>
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <input value={newMsg.subject} onChange={e => setNewMsg(prev => ({ ...prev, subject: e.target.value }))} placeholder="Subject" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            <textarea value={newMsg.body} onChange={e => setNewMsg(prev => ({ ...prev, body: e.target.value }))} rows={4} placeholder="Message" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            <button onClick={sendMessage} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition border-none cursor-pointer">Send</button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Message History</h2>
          {otherMessages.length === 0 && broadcasts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100 text-sm">No messages</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {otherMessages.map((m: any) => (
                <div key={m.id} className={`bg-white rounded-xl p-3 border text-sm cursor-pointer ${!m.isRead && m.direction === "incoming" ? "border-purple-200 bg-purple-50" : "border-gray-100"}`} onClick={() => { if (!m.isRead) markRead(m.id); }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{m.subject}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${m.senderType === "support" ? "bg-blue-100 text-blue-600" : m.senderType === "buyer" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>{m.senderType}</span>
                  </div>
                  <p className="text-gray-600">{m.body}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</p>
                    {!m.isRead && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
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
