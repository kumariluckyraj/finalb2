import { NextRequest, NextResponse } from "next/server";
import { getCart, removeCartItem } from "@/postgres/repositories/cart";
import { toApiCart } from "@/lib/apiTransform";
import { getAuthUser } from "@/lib/auth";

async function resolveUserId(): Promise<string | null> {
  try {
    const user = await getAuthUser();
    return user?.userId ?? null;
  } catch {
    return null;
  }
}

// DELETE /api/cart/[itemId]  — remove a single item from cart
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const removed = await removeCartItem(itemId);
  if (!removed) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const userId = await resolveUserId();
  const cart = await getCart(userId);
  return NextResponse.json({ success: true, items: toApiCart(cart).items });
}
