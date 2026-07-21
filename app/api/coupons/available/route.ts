import { NextRequest, NextResponse } from "next/server";
import { listActiveCouponsPublic } from "@/postgres/repositories/coupons";

export async function GET(_req: NextRequest) {
  try {
    const coupons = await listActiveCouponsPublic();

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
    }));

    return NextResponse.json({ coupons: publicCoupons });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
