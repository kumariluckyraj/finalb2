import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listProducts, deleteProduct } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const products = await listProducts();
  return NextResponse.json({ products: products.map(toApiProduct) });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

  const ok = await deleteProduct(id);
  return NextResponse.json({ success: ok });
}
