import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createCoupon, listCoupons } from "@/postgres/repositories/coupons";
import { query } from "@/postgres/lib/db";

function getTokenFromRequest(req: NextRequest): string | undefined {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies.get("token")?.value; // fallback, in case you also use cookie auth elsewhere
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "vendor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const coupons = await listCoupons("vendor", user.userId);
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "vendor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    if (!body.productId) {
      return NextResponse.json({ error: "productId is required for vendor coupons" }, { status: 400 });
    }
    if (!body.code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    // Ownership check — vendor can only create a coupon for their own product
   // Ownership check — vendor can only create a coupon for their own product
    console.log("DEBUG ownership check params:", {
      productId: body.productId,
      userId: user.userId,
    });

    const { rows } = await query<{ id: string }>(
      `SELECT id FROM seller_products WHERE id = $1 AND seller_id = $2 LIMIT 1`,
      [body.productId, user.userId]
    );

    console.log("DEBUG ownership check result:", rows);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Product not found or not owned by you" }, { status: 403 });
    }

    const coupon = await createCoupon({
      scope: "vendor",
      creatorId: user.userId,
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
      productId: body.productId,
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vendor/coupons error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}