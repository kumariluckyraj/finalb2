import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createCoupon, listCoupons } from "@/postgres/repositories/coupons";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const scope = req.nextUrl.searchParams.get("scope") ?? undefined;
    const coupons = await listCoupons(scope);
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
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const coupon = await createCoupon({
      scope: "platform",
      creatorId: user.userId,
      code: body.code.toUpperCase().trim(),
      title: body.title,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minCartValue: body.minCartValue,
      maxDiscount: body.maxDiscount,
      isReimbursed: true,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit ?? 1,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      bankCodes: body.bankCodes?.length ? body.bankCodes : null,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
