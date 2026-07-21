import { NextRequest, NextResponse } from "next/server";
import { isPincodeServiceable } from "@/postgres/repositories/productRecommendations";
import { query } from "@/postgres/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const pincode = req.nextUrl.searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ available: false, error: "Invalid pincode" });
    }

    const { rows } = await query<{ id: string }>(
      `SELECT id FROM seller_products WHERE id = $1 AND status = 'active' LIMIT 1`,
      [productId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ available: false, error: "Product not found" });
    }

    const available = await isPincodeServiceable(productId, pincode);

    return NextResponse.json({ available, pincode });
  } catch {
    return NextResponse.json({ available: false, error: "Server error" });
  }
}
