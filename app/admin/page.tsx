"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ShoppingBag, Store, Users, TrendingUp, DollarSign,
  Clock, Truck, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";

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
      .then((r) => r.json())
      .then((d) => { setMetrics(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-b2w-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = metrics
    ? [
        { label: "Total Orders",  value: metrics.totalOrders,     icon: Package,     color: "bg-blue-50 text-blue-600" },
        { label: "Revenue",       value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
        { label: "Products",      value: metrics.totalProducts,   icon: ShoppingBag, color: "bg-purple-50 text-purple-600" },
        { label: "Users",         value: metrics.totalUsers,      icon: Users,       color: "bg-cyan-50 text-cyan-600" },
        { label: "Vendors",       value: metrics.totalVendors,    icon: Store,       color: "bg-orange-50 text-orange-600" },
      ]
    : [];

  const pendingCount = metrics?.ordersByStatus?.pending ?? 0;
  const deliveredCount = metrics?.ordersByStatus?.delivered ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">Dashboard</h1>
          <p className="text-sm text-b2w-muted mt-0.5">Overview of your marketplace</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-b2w-border p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-b2w-muted uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-bold text-b2w-navy mt-0.5">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-b2w-border p-4">
          <h2 className="text-sm font-bold text-b2w-navy mb-4">Orders by Status</h2>
          {metrics && Object.keys(metrics.ordersByStatus).length > 0 ? (
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

        <div className="bg-white rounded-xl border border-b2w-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-b2w-navy">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "View Orders",     href: "/admin/orders",   icon: Package,     color: "bg-blue-50 text-blue-600" },
              { label: "Products",        href: "/admin/products", icon: ShoppingBag, color: "bg-purple-50 text-purple-600" },
              { label: "Vendors",         href: "/admin/vendors",  icon: Store,       color: "bg-orange-50 text-orange-600" },
              { label: "Manage Users",    href: "/admin/users",    icon: Users,       color: "bg-cyan-50 text-cyan-600" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-b2w-border hover:border-b2w-brand/30 transition cursor-pointer bg-transparent text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-b2w-navy">{action.label}</span>
                </button>
              );
            })}
          </div>

          {pendingCount > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>{pendingCount}</strong> order{pendingCount !== 1 ? "s" : ""} pending —{" "}
                <button onClick={() => router.push("/admin/orders")} className="underline font-semibold bg-transparent border-none cursor-pointer text-amber-800">
                  review now
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {metrics && metrics.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-b2w-border p-4">
          <h2 className="text-sm font-bold text-b2w-navy mb-4">Recent Orders</h2>
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
