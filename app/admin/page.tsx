"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  totalVendors: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    productName: string;
  }>;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  confirmed: "text-blue-600 bg-blue-50",
  processed: "text-indigo-600 bg-indigo-50",
  shipped: "text-teal-600 bg-teal-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) {
            router.push("/login");
            return null;
          }
          throw new Error("Failed to load dashboard metrics");
        }
        return r.json();
      })
      .then((d) => {
        if (d) setMetrics(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-b2w-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center py-12 text-gray-400">Failed to load dashboard</div>;
  }

  const pendingCount = metrics.ordersByStatus?.pending ?? 0;

  const cards = [
    { label: "Total Orders", value: metrics.totalOrders ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Revenue", value: `₹${(metrics.totalRevenue ?? 0).toLocaleString("en-IN")}`, color: "bg-green-50 text-green-700" },
    { label: "Products", value: metrics.totalProducts ?? 0, color: "bg-purple-50 text-purple-700" },
    { label: "Users", value: metrics.totalUsers ?? 0, color: "bg-cyan-50 text-cyan-700" },
    { label: "Vendors", value: metrics.totalVendors ?? 0, color: "bg-orange-50 text-orange-700" },
    { label: "Pending Orders", value: pendingCount, color: pendingCount > 0 ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-b2w-navy mb-1">Dashboard</h1>
      <p className="text-b2w-muted text-sm mb-6">Overview of your marketplace</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
            <p className="text-sm opacity-80 mb-1">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 border border-b2w-border">
          <h3 className="font-semibold text-b2w-navy mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/orders" className="p-3 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition">
              <span className="text-lg font-bold text-blue-600">List</span>
              <p className="text-sm font-medium text-blue-700 mt-1">Orders</p>
            </Link>
            <Link href="/admin/products" className="p-3 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition">
              <span className="text-lg font-bold text-purple-600">+</span>
              <p className="text-sm font-medium text-purple-700 mt-1">Products</p>
            </Link>
            <Link href="/admin/vendors" className="p-3 bg-orange-50 rounded-xl text-center hover:bg-orange-100 transition">
              <span className="text-lg font-bold text-orange-600">Store</span>
              <p className="text-sm font-medium text-orange-700 mt-1">Vendors</p>
            </Link>
            <Link href="/admin/users" className="p-3 bg-cyan-50 rounded-xl text-center hover:bg-cyan-100 transition">
              <span className="text-lg font-bold text-cyan-600">Users</span>
              <p className="text-sm font-medium text-cyan-700 mt-1">Manage Users</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-b2w-border">
          <h3 className="font-semibold text-b2w-navy mb-4">Alerts</h3>
          <div className="space-y-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700">
                    {pendingCount} order{pendingCount !== 1 ? "s" : ""} pending
                  </p>
                  <Link href="/admin/orders" className="text-xs text-amber-600 hover:underline">
                    Review now
                  </Link>
                </div>
              </div>
            )}
            {pendingCount === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No alerts — all clear!</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-b2w-border p-5">
          <h3 className="font-semibold text-b2w-navy mb-4">Orders by Status</h3>
          {Object.keys(metrics.ordersByStatus).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(metrics.ordersByStatus).map(([status, count]) => {
                const total = metrics.totalOrders || 1;
                const pct = (count / total) * 100;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-b2w-body w-24 capitalize">{status.replace(/_/g, " ")}</span>
                    <div className="flex-1 bg-b2w-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-b2w-brand h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-b2w-navy w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-b2w-muted text-center py-6">No orders yet</p>
          )}
        </div>
      </div>

      {metrics.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-b2w-border p-5">
          <h3 className="font-semibold text-b2w-navy mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-b2w-border text-left text-xs text-b2w-muted uppercase tracking-wider">
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2 pr-3">Product</th>
                  <th className="pb-2 pr-3 text-right">Amount</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-b2w-border last:border-0">
                    <td className="py-2.5 pr-3 font-mono text-xs text-b2w-muted">#{o.id.slice(0, 8)}</td>
                    <td className="py-2.5 pr-3 font-medium text-b2w-navy max-w-[200px] truncate">{o.productName}</td>
                    <td className="py-2.5 pr-3 text-right font-bold text-b2w-navy">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold capitalize ${STATUS_COLOR[o.status] ?? "text-gray-600 bg-gray-50"}`}>
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-b2w-muted">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}