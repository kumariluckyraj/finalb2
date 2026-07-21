import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createVariant, listVariantsByProduct, deleteVariantsByProduct } from "@/postgres/repositories/productVariants";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const variants = await listVariantsByProduct(id);
  return NextResponse.json({ variants });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (Array.isArray(body)) {
    await deleteVariantsByProduct(id);
    const variants = [];
    for (const v of body) {
      variants.push(await createVariant({ ...v, productId: id }));
    }
    return NextResponse.json({ success: true, variants });
  }

  const variant = await createVariant({ ...body, productId: id });
  return NextResponse.json({ success: true, variant }, { status: 201 });
}
