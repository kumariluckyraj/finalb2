import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addProductMedia, listMediaByProduct } from "@/postgres/repositories/productMedia";
import { findSellerProductById } from "@/postgres/repositories/sellerProducts";
import { syncFromSellerProduct } from "@/postgres/repositories/products";
import { uploadFile } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function syncProductToMain(id: string, user: any) {
  const product = await findSellerProductById(id);
  if (!product || product.status !== "active") return;
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
    status: product.status,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const media = await listMediaByProduct(id);
  return NextResponse.json({ media });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    const url = await uploadFile(file, "seller-products");
    const media = await addProductMedia({ productId: id, url, type: "image", isPrimary });
    await syncProductToMain(id, user);
    return NextResponse.json({ success: true, media });
  }

  const body = await req.json();
  const media = await addProductMedia({ ...body, productId: id });
  await syncProductToMain(id, user);
  return NextResponse.json({ success: true, media }, { status: 201 });
}
