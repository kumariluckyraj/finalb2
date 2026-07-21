import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as productRepo from "@/postgres/repositories/products";

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, productId, percent } = body;

    if (typeof percent !== "number" || percent < 0 || percent > 100) {
      return NextResponse.json({ error: "Percent must be a number between 0 and 100" }, { status: 400 });
    }

    if (category) {
      const updatedCount = await productRepo.updateCategoryCoinRedemptionPercent(category, percent);
      return NextResponse.json({ success: true, updatedCount, type: "category" });
    } else if (productId) {
      const success = await productRepo.updateProductCoinRedemptionPercent(productId, percent);
      if (!success) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, type: "product" });
    }

    return NextResponse.json({ error: "Must provide either category or productId" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to update limits" }, { status: 500 });
  }
}
