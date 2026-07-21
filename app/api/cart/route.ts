import { NextRequest, NextResponse } from "next/server";
import { addCartItem, getCart, updateCartItemQuantity } from "@/postgres/repositories/cart";
import { isPincodeServiceable } from "@/postgres/repositories/productRecommendations";
import { toApiCart } from "@/lib/apiTransform";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";

async function resolveUserId(): Promise<string | null> {
  try {
    const user = await getAuthUser();
    return user?.userId ?? null;
  } catch {
    return null;
  }
}

// Fetch the fields we need to validate a cart mutation against.
// Adjust column/table name if your schema differs (e.g. "products" vs "seller_products").
async function getProductForValidation(productId: string) {
  const { rows } = await query<{ id: string; stock: number; status: string }>(
    `SELECT id, stock, status FROM seller_products WHERE id = $1 LIMIT 1`,
    [productId]
  );
  return rows[0] ?? null;
}

// GET /api/cart
export async function GET() {
  const userId = await resolveUserId();
  const cart = await getCart(userId);
  return NextResponse.json({ items: toApiCart(cart).items });
}

// POST /api/cart — add item (increments qty if same product+size already in cart)
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId();
    const { productId, quantity = 1, size, pincode } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const product = await getProductForValidation(productId);
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    if (typeof product.stock === "number" && quantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} unit(s) available in stock` },
        { status: 400 }
      );
    }

    if (pincode) {
      if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
      }
      const serviceable = await isPincodeServiceable(productId, pincode);
      if (!serviceable) {
        return NextResponse.json(
          { error: `This product is not deliverable to ${pincode}` },
          { status: 400 }
        );
      }
    }

    await addCartItem(productId, quantity, size ?? "", userId);
    const cart = await getCart(userId);
    return NextResponse.json({ success: true, items: toApiCart(cart).items });
  } catch (err) {
    console.error("POST /api/cart failed:", err);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

// PATCH /api/cart — update quantity
// PATCH /api/cart — update quantity
export async function PATCH(req: NextRequest) {
  try {
    const { itemId, quantity } = await req.json();

    if (!itemId || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid itemId or quantity" }, { status: 400 });
    }

    const userId = await resolveUserId();

    // Look up the cart item first so we know which product's stock to check against.
    const currentCart = await getCart(userId);
    const currentItem = toApiCart(currentCart).items.find(
      (i: any) => i.id === itemId || i.itemId === itemId
    );
    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // currentItem.productId is the populated product object here, not a string id —
    // guard against null (product deleted/unpopulated) before reading stock off it.
    const product = currentItem.productId;
    if (product && typeof product.stock === "number" && quantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} unit(s) available in stock` },
        { status: 400 }
      );
    }

    const item = await updateCartItemQuantity(itemId, quantity);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const cart = await getCart(userId);
    return NextResponse.json({ success: true, items: toApiCart(cart).items });
  } catch (err) {
    console.error("PATCH /api/cart failed:", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}