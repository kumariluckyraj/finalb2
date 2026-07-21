import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findActiveCouponByCode, getUserCouponUsage } from "@/postgres/repositories/coupons";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);

    const code = req.nextUrl.searchParams.get("code");
    const cartTotal = parseFloat(req.nextUrl.searchParams.get("cartTotal") ?? "0");

    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const coupon = await findActiveCouponByCode(code.toUpperCase().trim());
    if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });

    if (coupon.minCartValue && cartTotal < coupon.minCartValue) {
      return NextResponse.json({ error: `Minimum cart value of ₹${coupon.minCartValue} required` }, { status: 400 });
    }

    const userUsage = await getUserCouponUsage(coupon.id, user.userId);
    if (userUsage >= coupon.perUserLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    let discountAmount: number;
    if (coupon.discountType === "percentage") {
      discountAmount = cartTotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, cartTotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        isReimbursed: coupon.isReimbursed,
      },
      discountAmount,
      finalTotal: cartTotal - discountAmount,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
