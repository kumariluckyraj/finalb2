import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listSellerOrders, getSellerOrderStats } from "@/postgres/repositories/sellerOrders";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const url = new URL(req.url);
  if (url.searchParams.get("stats") === "true") {
    const stats = await getSellerOrderStats(profile.id);
    return NextResponse.json({ stats });
  }

  const orders = await listSellerOrders(profile.id, {
    status: url.searchParams.get("status") || undefined,
    limit: Number(url.searchParams.get("limit")) || 50,
    offset: Number(url.searchParams.get("offset")) || 0,
  });

  return NextResponse.json({ orders });
}
