import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = (Math.max(1, page) - 1) * limit;
  const category = searchParams.get("category");

  try {
    const conditions = ["1=1"];
    const params: any[] = [];

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM products WHERE ${conditions.join(" AND ")}`,
      params
    );
    const total = parseInt(countResult.rows[0].count as string, 10);

    const { rows } = await query(
      `SELECT id, name, category, max_coin_redemption_percent AS "maxCoinRedemptionPercent"
       FROM products
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({ products: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch products" }, { status: 500 });
  }
}
