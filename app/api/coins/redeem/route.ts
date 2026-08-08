import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";
import { getOrCreateWallet } from "@/postgres/repositories/coins";
import { resolveMaxCoinRedemptionPercent, DEFAULT_MAX_COIN_REDEMPTION_PERCENT } from "@/lib/coins/wallet-service";

type ProductCoinConfig = { id: string; maxCoinRedemptionPercent: number | null };

async function fetchProductCoinConfig(productIds: string[]): Promise<Map<string, ProductCoinConfig>> {
  if (productIds.length === 0) return new Map();
const { rows } = await query<ProductCoinConfig>(
    `SELECT id, max_coin_redemption_percent AS "maxCoinRedemptionPercent"
     FROM products WHERE id = ANY($1::text[])`,
    [productIds]
  );
  return new Map(rows.map((r) => [String(r.id), r]));
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const amount = Number(searchParams.get("amount") ?? 0);
  const productId = searchParams.get("productId");
  const itemsParam = searchParams.get("items");

  const wallet = await getOrCreateWallet(user.userId);

  let cap = 0;
  let effectivePercent = DEFAULT_MAX_COIN_REDEMPTION_PERCENT;

  if (itemsParam) {
    // Cart checkout: items from potentially different vendors, each with its own cap.
    let items: { productId: string; subtotal: number }[] = [];
    try {
      items = JSON.parse(itemsParam);
    } catch {
      items = [];
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);
    const configMap = await fetchProductCoinConfig(productIds);

    cap = items.reduce((sum, item) => {
      const percent = resolveMaxCoinRedemptionPercent(configMap.get(item.productId)?.maxCoinRedemptionPercent);
      return sum + (item.subtotal * percent) / 100;
    }, 0);

    // For display purposes, surface the most restrictive percent in the cart.
    effectivePercent = items.length
      ? Math.min(...items.map((item) => resolveMaxCoinRedemptionPercent(configMap.get(item.productId)?.maxCoinRedemptionPercent)))
      : DEFAULT_MAX_COIN_REDEMPTION_PERCENT;
  } else if (productId) {
    const configMap = await fetchProductCoinConfig([productId]);
    effectivePercent = resolveMaxCoinRedemptionPercent(configMap.get(productId)?.maxCoinRedemptionPercent);
    cap = (amount * effectivePercent) / 100;
  } else {
    // No product context — fall back to platform default so the endpoint still works.
    cap = (amount * DEFAULT_MAX_COIN_REDEMPTION_PERCENT) / 100;
  }

  const maxRedeemable = Math.max(0, Math.floor(Math.min(wallet.balance, cap, amount)));

  return NextResponse.json({
    walletBalance: wallet.balance,
    maxRedeemable,
    maxRedemptionPercent: effectivePercent,
  });
}