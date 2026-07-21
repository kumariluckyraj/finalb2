import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ rows: orderStats }] = await Promise.all([
    query<{
      total_orders: string;
      total_revenue: string;
    }>(`SELECT COUNT(*)::text AS total_orders, COALESCE(SUM(total_amount), 0)::text AS total_revenue FROM orders`),
  ]);

  const totalOrders = parseInt(orderStats[0]?.total_orders ?? "0");
  const totalRevenue = parseFloat(orderStats[0]?.total_revenue ?? "0");

  const { rows: productCount } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM products`);
  const totalProducts = parseInt(productCount[0]?.count ?? "0");

  const { rows: userCount } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users`);
  const totalUsers = parseInt(userCount[0]?.count ?? "0");

  const { rows: vendorCount } = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE role = 'vendor'`);
  const totalVendors = parseInt(vendorCount[0]?.count ?? "0");

  const { rows: statusRows } = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count FROM orders GROUP BY status ORDER BY status`
  );
  const ordersByStatus: Record<string, number> = {};
  statusRows.forEach((r: { status: string; count: string }) => { ordersByStatus[r.status] = parseInt(r.count); });

  const { rows: recentRows } = await query<{
    id: string;
    total_amount: string;
    status: string;
    created_at: string;
    product_name: string | null;
  }>(
    `SELECT o.id, o.total_amount::text, o.status, o.created_at, COALESCE(p.name, 'Unknown') AS product_name
     FROM orders o LEFT JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT 5`
  );

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    totalProducts,
    totalUsers,
    totalVendors,
    ordersByStatus,
    recentOrders: recentRows.map((r: { id: string; total_amount: string; status: string; created_at: string; product_name: string | null }) => ({
      id: r.id,
      totalAmount: parseFloat(r.total_amount),
      status: r.status,
      createdAt: r.created_at,
      productName: r.product_name,
    })),
  });
}
