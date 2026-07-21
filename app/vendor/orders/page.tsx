"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  new: "New", confirmed: "Confirmed", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700", shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [tracking, setTracking] = useState("");

  const load = (status = "") => {
    setLoading(true);
    const url = status ? `/api/seller/orders?status=${status}` : "/api/seller/orders";
    fetch(url).then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/seller/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load(filter);
    setSelected(null);
  };

  const addTracking = async (id: string) => {
    await fetch(`/api/seller/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: tracking }),
    });
    setTracking("");
    load(filter);
    setSelected(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "new", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"].map(s => (
          <button key={s} onClick={() => { setFilter(s); load(s); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  <p className="text-sm text-gray-500 mt-1">Qty: {order.quantity} · ₹{order.totalPrice?.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(selected?.id === order.id ? null : order)} className="px-3 py-1.5 text-xs text-brand-blue hover:bg-blue-50 rounded-lg">Manage</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-800 mb-4">Manage Order</h3>
            <p className="text-sm text-gray-500 mb-4">Current status: <span className="font-semibold text-gray-800">{STATUS_LABELS[selected.status]}</span></p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {["confirmed", "packed", "shipped", "delivered"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium ${selected.status === s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  Mark {STATUS_LABELS[s]}
                </button>
              ))}
              {selected.status !== "cancelled" && selected.status !== "delivered" && (
                <button onClick={() => updateStatus(selected.id, "cancelled")} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">Cancel Order</button>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Tracking Number</label>
              <div className="flex gap-2">
                <input value={tracking} onChange={e => setTracking(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Enter tracking number" />
                <button onClick={() => addTracking(selected.id)} className="px-3 py-2 bg-brand-blue text-white rounded-lg text-sm">Save</button>
              </div>
            </div>

            <button onClick={() => setSelected(null)} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
