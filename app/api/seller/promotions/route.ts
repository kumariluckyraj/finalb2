import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { createPromotion, listPromotionsBySeller, togglePromotionStatus } from "@/postgres/repositories/promotions";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const promotions = await listPromotionsBySeller(profile.id);
  return NextResponse.json({ promotions });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();
  const promotion = await createPromotion({ ...body, sellerId: profile.id });
  return NextResponse.json({ success: true, promotion }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.id && body.isActive !== undefined) {
    const promo = await togglePromotionStatus(body.id, body.isActive);
    return NextResponse.json({ success: true, promotion: promo });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
