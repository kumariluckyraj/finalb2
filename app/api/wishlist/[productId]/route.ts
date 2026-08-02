import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { removeFromWishlist, removeFromAllFolders, getWishlistCount } from "@/postgres/repositories/wishlist";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const folderId = req.nextUrl.searchParams.get("folderId");

  if (folderId) {
    await removeFromWishlist(user.userId, productId, folderId);
  } else {
    await removeFromAllFolders(user.userId, productId);
  }

  const count = await getWishlistCount(user.userId);
  return NextResponse.json({ success: true, count });
}