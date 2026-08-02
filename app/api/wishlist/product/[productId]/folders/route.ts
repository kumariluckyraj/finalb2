import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getFoldersForProduct } from "@/postgres/repositories/wishlist";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ folderIds: [] });

  const { productId } = await params;
  const folderIds = await getFoldersForProduct(user.userId, productId);
  return NextResponse.json({ folderIds });
}