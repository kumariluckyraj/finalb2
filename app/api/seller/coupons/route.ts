import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listCouponsByCreator, createCoupon } from "@/postgres/repositories/coupons";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Seller profile required" }, { status: 403 });

    const coupons = await listCouponsByCreator(profile.id);
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Seller profile required" }, { status: 403 });

    const body = await req.json();
    const coupon = await createCoupon({
      scope: "seller",
      creatorId: profile.id,
      code: body.code.toUpperCase().trim(),
      title: body.title,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minCartValue: body.minCartValue,
      maxDiscount: body.maxDiscount,
      isReimbursed: false,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit ?? 1,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
