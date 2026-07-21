import { NextRequest, NextResponse } from "next/server";
import { findProductById } from "@/postgres/repositories/products";
import { findSiblingProducts, isPincodeServiceable } from "@/postgres/repositories/productRecommendations";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const product = await findProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const group = await findSiblingProducts(productId);
    if (!group || group.listings.length === 0) {
      return NextResponse.json({ listings: [], cheapestPrice: null, currentIsCheapest: true });
    }

    let userPincode: string | null = null;
    try {
      const user = await getAuthUser();
      if (user?.userId) {
        const { rows } = await query<{ pincode: string }>(
          `SELECT pincode FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1`,
          [user.userId]
        );
        if (rows.length > 0) {
          userPincode = rows[0].pincode;
        }
      }
    } catch {
      // Not authenticated — skip pincode check
    }

    const currentPrice = product.price;

    const listings = await Promise.all(
      group.listings.map(async (l) => {
        let shipsToUser: boolean | null = null;
        if (userPincode) {
          shipsToUser = await isPincodeServiceable(l.sellerProductId, userPincode);
        }

        return {
          sellerProductId: l.sellerProductId,
          sellerId: l.sellerId,
          storeName: l.storeName || l.businessName,
          storeId: l.storeId,
          price: l.price,
          mrp: l.actualPrice,
          discount: l.discount,
          stock: l.stock,
          image: l.image,
          shipsToUser,
          distanceLabel: l.shipsFrom || l.sellerCity || null,
          currentPrice,
          isCheapest: l.price === group.listings[0].price,
          businessName: l.businessName,
        };
      })
    );

    const cheapestPrice = Math.min(...listings.map(l => l.price));
    const currentIsCheapest = currentPrice <= cheapestPrice;

    return NextResponse.json({
      listings,
      cheapestPrice,
      currentProductId: productId,
      currentIsCheapest,
    });
  } catch (err) {
    return NextResponse.json({ listings: [], cheapestPrice: null, currentIsCheapest: true });
  }
}
