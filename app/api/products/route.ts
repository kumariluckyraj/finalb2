import { NextResponse } from "next/server";
import { searchProducts } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const products = await searchProducts({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    minPrice: url.searchParams.get("minPrice"),
    maxPrice: url.searchParams.get("maxPrice"),
    inStock: url.searchParams.get("inStock"),
    limit: url.searchParams.get("limit"),
  });
  return NextResponse.json({ products: products.map(toApiProduct) });
}
