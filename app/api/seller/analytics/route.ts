import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { query } from "@/postgres/lib/db";
import { getSellerOrderStats } from "@/postgres/repositories/sellerOrders";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "weekly";

  let dateDays = "7";
  if (period === "monthly") {
    dateDays = "30";
  } else if (period === "yearly") {
    dateDays = "365";
  }

  const revenue = await query<Record<string, unknown>>(
    `SELECT DATE(created_at) AS date, COUNT(*)::int AS orders, COALESCE(SUM(total_price), 0)::float8 AS revenue
     FROM seller_orders
     WHERE seller_id = $1 AND created_at >= NOW() - ($2::text || ' days')::interval
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [profile.id, dateDays]
  );

  const topProducts = await query<Record<string, unknown>>(
    `SELECT sp.name, COUNT(*)::int AS orders, COALESCE(SUM(so.total_price), 0)::float8 AS revenue
     FROM seller_orders so
     JOIN seller_products sp ON sp.id = so.product_id
     WHERE so.seller_id = $1 AND so.created_at >= NOW() - ($2::text || ' days')::interval
     GROUP BY sp.name
     ORDER BY revenue DESC
     LIMIT 10`,
    [profile.id, dateDays]
  );

  const stats = await getSellerOrderStats(profile.id);

  return NextResponse.json({
    revenue: revenue.rows,
    topProducts: topProducts.rows,
    stats,
    period,
  });
}
