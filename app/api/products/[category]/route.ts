import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function GET(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const url = new URL(req.url);
  const products = await searchProducts({
    category,
    q: url.searchParams.get("q") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    minPrice: url.searchParams.get("minPrice"),
    maxPrice: url.searchParams.get("maxPrice"),
    inStock: url.searchParams.get("inStock"),
    limit: url.searchParams.get("limit"),
  });
  return NextResponse.json({ products: products.map(toApiProduct) });
}
