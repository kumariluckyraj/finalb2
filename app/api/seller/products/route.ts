import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { createSellerProduct, listSellerProducts, bulkUpdateStock } from "@/postgres/repositories/sellerProducts";
import { createInventoryLog } from "@/postgres/repositories/inventoryLogs";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const url = new URL(req.url);
  const products = await listSellerProducts(profile.id, {
    status: url.searchParams.get("status") || undefined,
    category: url.searchParams.get("category") || undefined,
    search: url.searchParams.get("search") || undefined,
    lowStock: url.searchParams.get("lowStock") === "true" || undefined,
    limit: Number(url.searchParams.get("limit")) || 50,
    offset: Number(url.searchParams.get("offset")) || 0,
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();
  const product = await createSellerProduct({ ...body, sellerId: profile.id });

  await createInventoryLog({
    productId: product.id,
    changeType: "manual_adjustment",
    quantityChange: product.stock,
    stockBefore: 0,
    stockAfter: product.stock,
    reason: "Initial stock setup",
  });

  return NextResponse.json({ success: true, product }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.bulkStock) {
    await bulkUpdateStock(body.bulkStock);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
