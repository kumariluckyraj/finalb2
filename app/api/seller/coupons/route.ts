import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listCouponsByCreator, createCoupon } from "@/postgres/repositories/coupons";
import type { DiscountType } from "@/postgres/models/Coupon";

const VALID_DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"];

function isDiscountType(value: unknown): value is DiscountType {
  return typeof value === "string" && (VALID_DISCOUNT_TYPES as string[]).includes(value);
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await verifyToken(token);
    } catch (tokenErr) {
      console.error("seller/coupons GET: invalid/expired token:", tokenErr);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) {
      return NextResponse.json({ error: "Seller profile required" }, { status: 403 });
    }

    const coupons = await listCouponsByCreator(profile.id);
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("seller/coupons GET error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await verifyToken(token);
    } catch (tokenErr) {
      console.error("seller/coupons POST: invalid/expired token:", tokenErr);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) {
      return NextResponse.json({ error: "Seller profile required" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const requiredFields = [
      "code",
      "title",
      "discountType",
      "discountValue",
      "startsAt",
      "endsAt",
    ];
    const missing = requiredFields.filter(
      (f) => body[f] === undefined || body[f] === null || body[f] === ""
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isDiscountType(body.discountType)) {
      return NextResponse.json(
        {
          error: `Invalid discountType. Expected one of: ${VALID_DISCOUNT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const discountValue = Number(body.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: "discountValue must be a positive number" }, { status: 400 });
    }
    if (body.discountType === "percentage" && discountValue > 100) {
      return NextResponse.json(
        { error: "discountValue cannot exceed 100 for percentage discounts" },
        { status: 400 }
      );
    }

    const startsAt = new Date(body.startsAt as string);
    const endsAt = new Date(body.endsAt as string);
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "Invalid startsAt/endsAt date" }, { status: 400 });
    }
    if (endsAt <= startsAt) {
      return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
    }

    const coupon = await createCoupon({
      scope: "seller",
      creatorId: profile.id,
      code: String(body.code).toUpperCase().trim(),
      title: body.title as string,
      description: (body.description as string) ?? undefined,
      discountType: body.discountType, // narrowed to DiscountType by isDiscountType guard
      discountValue,
      minCartValue: body.minCartValue !== undefined ? Number(body.minCartValue) : undefined,
      maxDiscount: body.maxDiscount !== undefined ? Number(body.maxDiscount) : undefined,
      isReimbursed: false,
      usageLimit: body.usageLimit !== undefined ? Number(body.usageLimit) : undefined,
      perUserLimit: body.perUserLimit !== undefined ? Number(body.perUserLimit) : 1,
      startsAt,
      endsAt,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error("seller/coupons POST error:", err);

    // Postgres unique_violation on the coupon code column
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}