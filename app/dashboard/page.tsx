"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle2, Clock, ChevronRight, AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";

type OrderStatus =
  | "pending" | "confirmed" | "processed" | "picked_up"
  | "shipped" | "hub" | "out_for_delivery" | "delivered";

const STATUS_CONFIG: Record<OrderStatus, { label: string; badgeBg: string; badgeText: string }> = {
  pending:          { label: "Pending",          badgeBg: "bg-amber-50",     badgeText: "text-amber-700" },
  confirmed:        { label: "Confirmed",        badgeBg: "bg-blue-50",      badgeText: "text-blue-700" },
  processed:        { label: "Processing",       badgeBg: "bg-indigo-50",    badgeText: "text-indigo-700" },
  picked_up:        { label: "Picked Up",        badgeBg: "bg-purple-50",    badgeText: "text-purple-700" },
  shipped:          { label: "Shipped",          badgeBg: "bg-teal-50",      badgeText: "text-teal-700" },
  hub:              { label: "At Hub",           badgeBg: "bg-pink-50",      badgeText: "text-pink-700" },
  out_for_delivery: { label: "Out for Delivery", badgeBg: "bg-orange-50",    badgeText: "text-orange-700" },
  delivered:        { label: "Delivered",        badgeBg: "bg-green-50",     badgeText: "text-green-700" },
};

const STATUS_ORDER: OrderStatus[] = [
  "pending", "confirmed", "processed", "picked_up",
  "shipped", "hub", "out_for_delivery", "delivered",
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-b2w-border p-4 flex gap-4 items-center animate-pulse">
      <div className="w-16 h-16 rounded-sm bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="w-20 h-7 rounded-full bg-gray-200 shrink-0" />
    </div>
  );
}

function MiniProgress({ status }: { status: OrderStatus }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-0.5">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= idx;
        const isCurrent = i === idx;
        return (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              done ? (isCurrent ? "bg-b2w-navy" : "bg-b2w-green") : "bg-gray-200"
            } ${isCurrent ? "w-3.5" : "w-2"}`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    fetch("/api/orders", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) throw new Error("login");
          throw new Error("Failed to load orders");
        }
        const d = await r.json();
        setOrders(d.orders || []);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const totalOrders = orders.length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const inTransitCount = orders.filter((o) =>
    ["shipped", "hub", "out_for_delivery"].includes(o.status)
  ).length;
  const processingCount = orders.filter((o) =>
    ["pending", "confirmed", "processed", "picked_up"].includes(o.status)
  ).length;

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: Package, color: "text-b2w-navy", bg: "bg-blue-50" },
    { label: "Delivered", value: deliveredCount, icon: CheckCircle2, color: "text-b2w-green", bg: "bg-green-50" },
    { label: "In Transit", value: inTransitCount, icon: Truck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Processing", value: processingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  if (error === "login") {
    return (
      <div className="min-h-screen bg-b2w-bg">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="bg-white rounded-lg border border-b2w-border p-12 max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-b2w-muted mx-auto mb-4" />
            <h1 className="text-xl font-bold text-b2w-navy mb-2">Login to view your orders</h1>
            <p className="text-sm text-b2w-muted mb-6">Sign in to track your orders, check delivery status, and view your order history.</p>
            <button
              onClick={() => router.push("/login")}
              className="bg-b2w-teal text-b2w-navy border-none px-8 py-3 rounded-sm text-sm font-bold cursor-pointer hover:opacity-90"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-b2w-bg">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-b2w-navy">My Orders</h1>
            {!loading && (
              <p className="text-xs text-b2w-muted mt-0.5">{totalOrders} {totalOrders === 1 ? "order" : "orders"}</p>
            )}
          </div>
          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 text-xs text-b2w-muted hover:text-b2w-navy bg-transparent border border-b2w-border rounded-sm px-3 py-1.5 cursor-pointer transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && error !== "login" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-b2w-red shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="text-sm font-semibold text-red-700 bg-transparent border border-red-300 rounded-sm px-3 py-1 cursor-pointer hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats strip */}
        {!loading && !error && totalOrders > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className={`${s.bg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-b2w-muted font-medium">{s.label}</span>
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-lg border border-b2w-border p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-b2w-border mx-auto mb-4" />
            <h2 className="text-lg font-bold text-b2w-navy mb-2">No orders yet</h2>
            <p className="text-sm text-b2w-muted mb-6 max-w-xs mx-auto">
              Explore our products and place your first order. Your purchase history will appear here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-b2w-teal text-b2w-navy border-none px-8 py-3 rounded-sm text-sm font-bold cursor-pointer hover:opacity-90"
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-2.5">
            {orders.map((order, idx) => {
              const product = order.productId;
              const status = (order.status || "pending") as OrderStatus;
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const discountPct =
                product?.actualPrice && product?.price
                  ? Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100)
                  : 0;

              return (
                <button
                  key={order._id}
                  onClick={() => router.push(`/orders/${order._id}`)}
                  className="w-full bg-white rounded-lg border border-b2w-border p-4 flex items-center gap-4 text-left cursor-pointer hover:border-b2w-navy/40 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-sm border border-b2w-border shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {product?.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-b2w-muted" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-b2w-navy truncate">
                      {product?.name || "Product"}
                    </p>
                    <p className="text-xs text-b2w-muted mt-0.5">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                      {order.quantity > 1 && ` | Qty: ${order.quantity}`}
                      {order.address?.city && ` | ${order.address.city}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-b2w-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {!["delivered", "pending"].includes(order.status) && (
                      <div className="mt-1.5">
                        <MiniProgress status={status} />
                      </div>
                    )}
                  </div>

                  {/* Chevon */}
                  <ChevronRight className="w-5 h-5 text-b2w-muted group-hover:text-b2w-navy shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
