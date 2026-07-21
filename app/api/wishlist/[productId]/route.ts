import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { removeFromWishlist, getWishlistCount } from "@/postgres/repositories/wishlist";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  await removeFromWishlist(user.userId, productId);
  const count = await getWishlistCount(user.userId);
  return NextResponse.json({ success: true, count });
}
