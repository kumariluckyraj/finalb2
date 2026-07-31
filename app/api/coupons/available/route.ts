import { NextRequest, NextResponse } from "next/server";
import { listActiveCouponsPublic } from "@/postgres/repositories/coupons";

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId") ?? undefined;
    const coupons = await listActiveCouponsPublic(productId);

    const publicCoupons = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minCartValue: c.minCartValue,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      usageCount: c.usageCount,
      endsAt: c.endsAt,
      startsAt: c.startsAt,
      productId: c.productId,     // NEW — null means platform-wide
      bankCodes: c.bankCodes,     // NEW — null means no bank restriction
    }));

    return NextResponse.json({ coupons: publicCoupons });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}