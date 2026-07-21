import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { earnCoins, checkAndUpgradeTier } from "@/lib/coins/wallet-service";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { orderId, orderAmount } = body;

    if (!orderId || !orderAmount) {
      return NextResponse.json({ error: "orderId and orderAmount are required" }, { status: 400 });
    }

    const coinsPer100 = 5;
    const baseCoins = Math.floor(orderAmount / 100) * coinsPer100;
    if (baseCoins <= 0) {
      return NextResponse.json({ earned: 0 });
    }

    const tx = await earnCoins({
      userId: user.userId,
      amount: baseCoins,
      source: "order_pending",
      referenceType: "order",
      referenceId: orderId,
      description: `Earned ${baseCoins} coins for order #${orderId}`,
      isPending: true,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    });

    await checkAndUpgradeTier(user.userId);

    return NextResponse.json({ transaction: tx, earned: baseCoins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 400 });
  }
}
