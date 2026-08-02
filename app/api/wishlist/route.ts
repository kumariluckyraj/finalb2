import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserWishlist, addToWishlist, getWishlistCount } from "@/postgres/repositories/wishlist";

async function requireUser() {
  const user = await getAuthUser();
  if (!user?.userId) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ productIds: [], count: 0 });

  const folderId = req.nextUrl.searchParams.get("folderId") ?? undefined;
  const productIds = await getUserWishlist(user.userId, folderId);
  return NextResponse.json({ productIds, count: productIds.length });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, folderId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await addToWishlist(user.userId, productId, folderId);
  const count = await getWishlistCount(user.userId);
  return NextResponse.json({ success: true, count });
}