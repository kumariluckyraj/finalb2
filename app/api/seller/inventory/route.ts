import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listSellerProducts, bulkUpdateStock } from "@/postgres/repositories/sellerProducts";
import { createInventoryLog } from "@/postgres/repositories/inventoryLogs";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const url = new URL(req.url);
  const products = await listSellerProducts(profile.id, {
    status: url.searchParams.get("status") || undefined,
    search: url.searchParams.get("search") || undefined,
    lowStock: url.searchParams.get("lowStock") === "true" || undefined,
    limit: Number(url.searchParams.get("limit")) || 100,
    offset: Number(url.searchParams.get("offset")) || 0,
  });

  const productsWithStockInfo = await Promise.all(
    products.map(async (p) => {
      const { rows } = await query<{ totalAdded: number }>(
        `SELECT COALESCE(SUM(quantity_change), 0)::integer AS "totalAdded"
         FROM inventory_logs
         WHERE product_id = $1 AND change_type IN ('stock_added', 'bulk_update') AND quantity_change > 0`,
        [p.id]
      );
      return {
        ...p,
        totalStockAdded: rows[0]?.totalAdded ?? p.stock,
      };
    })
  );

  return NextResponse.json({ products: productsWithStockInfo });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();

  if (body.bulkStock) {
    for (const update of body.bulkStock) {
      const product = await listSellerProducts(profile.id, { limit: 1 });
      const existing = product.find(p => p.id === update.id);
      if (existing) {
        await createInventoryLog({
          productId: update.id,
          changeType: "bulk_update",
          quantityChange: update.stock - existing.stock,
          stockBefore: existing.stock,
          stockAfter: update.stock,
          reason: body.reason || "Bulk stock update",
        });
      }
    }
    await bulkUpdateStock(body.bulkStock);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
