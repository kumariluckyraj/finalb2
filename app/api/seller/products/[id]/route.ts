import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { findSellerProductById, updateSellerProduct, deleteSellerProduct, duplicateProduct } from "@/postgres/repositories/sellerProducts";
import { syncFromSellerProduct } from "@/postgres/repositories/products";
import { listVariantsByProduct } from "@/postgres/repositories/productVariants";
import { listMediaByProduct } from "@/postgres/repositories/productMedia";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await findSellerProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variants = await listVariantsByProduct(id);
  const media = await listMediaByProduct(id);

  return NextResponse.json({ product, variants, media });
}

async function syncProduct(id: string, status: string, user: any) {
  const product = await findSellerProductById(id);
  if (!product) return;
  const media = await listMediaByProduct(id);
  const primaryImage = media.find(m => m.isPrimary)?.url || media[0]?.url || "";
  await syncFromSellerProduct({
    id: product.id,
    vendorId: user.userId,
    name: product.name,
    description: product.description,
    category: product.category,
    mrp: product.mrp,
    sellingPrice: product.sellingPrice,
    discount: product.discount,
    image: primaryImage,
    stock: product.stock,
    brand: product.brand,
    status: status,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.action === "duplicate") {
    const dup = await duplicateProduct(id);
    return NextResponse.json({ success: true, product: dup });
  }

  if (body.action === "archive") {
    const product = await updateSellerProduct(id, { status: "archived" });
    await syncProduct(id, "archived", user);
    return NextResponse.json({ success: true, product });
  }

  if (body.action === "unlist") {
    const product = await updateSellerProduct(id, { status: "unlisted" });
    await syncProduct(id, "unlisted", user);
    return NextResponse.json({ success: true, product });
  }

  const product = await updateSellerProduct(id, body);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await syncProduct(id, product.status, user);

  return NextResponse.json({ success: true, product });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteSellerProduct(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Also remove from main products table
  const { query } = await import("@/postgres/lib/db");
  await query("DELETE FROM products WHERE id = $1", [id]);

  return NextResponse.json({ success: true });
}
