"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SellerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-center py-12 text-gray-400">Failed to load dashboard</div>;

  const { orderStats, payoutSummary, weeklyRevenue, lowStockCount, unreadMessages, pincodeCoverageCount, totalActiveProducts } = data;

  const cards = [
    { label: "Total Orders", value: orderStats?.totalOrders ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Revenue", value: `₹${(orderStats?.revenue ?? 0).toLocaleString("en-IN")}`, color: "bg-green-50 text-green-700" },
    { label: "Pending", value: orderStats?.pendingOrders ?? 0, color: "bg-yellow-50 text-yellow-700" },
    { label: "Pending Shipments", value: orderStats?.pendingShipments ?? 0, color: "bg-orange-50 text-orange-700" },
    { label: "Returns", value: orderStats?.returns ?? 0, color: orderStats?.returns > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700" },
    { label: "Weekly Revenue", value: `₹${(weeklyRevenue ?? 0).toLocaleString("en-IN")}`, color: "bg-indigo-50 text-indigo-700" },
    { label: "Pending Payout", value: `₹${(payoutSummary?.pendingPayout ?? 0).toLocaleString("en-IN")}`, color: "bg-teal-50 text-teal-700" },
    { label: "Low Stock Items", value: lowStockCount ?? 0, color: lowStockCount > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700" },
    { label: "Pincode Coverage", value: `${pincodeCoverageCount ?? 0}/${totalActiveProducts ?? 0}`, color: "bg-cyan-50 text-cyan-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Seller Dashboard</h1>
      <p className="text-gray-400 text-sm mb-6">Welcome back, {data.profile?.businessName}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
            <p className="text-sm opacity-80 mb-1">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vendor/products/new" className="p-3 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition">
              <span className="text-lg font-bold text-brand-blue">+</span>
              <p className="text-sm font-medium text-blue-700 mt-1">Add Product</p>
            </Link>
            <Link href="/vendor/orders" className="p-3 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition">
              <span className="text-lg font-bold text-blue-600">List</span>
              <p className="text-sm font-medium text-blue-700 mt-1">Orders</p>
            </Link>
            <Link href="/vendor/inventory" className="p-3 bg-green-50 rounded-xl text-center hover:bg-green-100 transition">
              <span className="text-lg font-bold text-green-600">Stock</span>
              <p className="text-sm font-medium text-green-700 mt-1">Inventory</p>
            </Link>
            <Link href="/vendor/payouts" className="p-3 bg-teal-50 rounded-xl text-center hover:bg-teal-100 transition">
              <span className="text-lg font-bold text-teal-600">₹</span>
              <p className="text-sm font-medium text-teal-700 mt-1">Payouts</p>
            </Link>
            <Link href="/vendor/pincodes" className="p-3 bg-cyan-50 rounded-xl text-center hover:bg-cyan-100 transition">
              <span className="text-lg font-bold text-cyan-600">📍</span>
              <p className="text-sm font-medium text-cyan-700 mt-1">Pincodes</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Alerts</h3>
          <div className="space-y-3">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-bold text-red-600">Alert</span>
                <div>
                  <p className="text-sm font-medium text-red-700">{lowStockCount} product(s) low on stock</p>
                  <Link href="/vendor/inventory?lowStock=true" className="text-xs text-red-500 hover:underline">View</Link>
                </div>
              </div>
            )}
            {unreadMessages > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <span className="text-sm font-bold text-blue-600">Message</span>
                <div>
                  <p className="text-sm font-medium text-blue-700">{unreadMessages} unread message(s)</p>
                  <Link href="/vendor/messages" className="text-xs text-blue-500 hover:underline">View</Link>
                </div>
              </div>
            )}
            {orderStats?.returns > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                <span className="text-sm font-bold text-yellow-600">Return</span>
                <div>
                  <p className="text-sm font-medium text-yellow-700">{orderStats.returns} return request(s)</p>
                  <Link href="/vendor/returns" className="text-xs text-yellow-600 hover:underline">View</Link>
                </div>
              </div>
            )}
            {lowStockCount === 0 && unreadMessages === 0 && orderStats?.returns === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No alerts - all clear!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
