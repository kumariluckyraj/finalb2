import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { redeemCoins, getUserWallet } from "@/lib/coins/wallet-service";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { amount, orderId, cartTotal, productId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const wallet = await getUserWallet(user.userId);
    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    let maxPercent = 10;
    if (productId) {
      const { findProductById } = await import("@/postgres/repositories/products");
      const product = await findProductById(productId);
      if (product) maxPercent = product.maxCoinRedemptionPercent;
    }

    const tier = await (await import("@/postgres/repositories/coins")).getUserTier(user.userId);
    const tierPercent = tier?.maxRedemptionPercent ?? 10;
    maxPercent = Math.min(maxPercent, tierPercent);

    const maxByPercent = Math.floor((cartTotal * maxPercent) / 100);
    if (amount > maxByPercent) {
      return NextResponse.json({ error: `Cannot redeem more than ${maxPercent}% (${maxByPercent} coins) of cart value` }, { status: 400 });
    }

    const result = await redeemCoins({
      userId: user.userId,
      amount,
      referenceType: "order",
      referenceId: orderId,
      idempotencyKey: `order_redeem:${orderId}:${user.userId}`,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to redeem coins" }, { status: 400 });
  }
}
