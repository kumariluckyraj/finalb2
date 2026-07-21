import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { earnCoins, checkAndUpgradeTier } from "@/lib/coins/wallet-service";
import * as coinRepo from "@/postgres/repositories/coins";
import { withTransaction } from "@/postgres/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const existingEarns = await coinRepo.getTransactionsByReference("order", orderId);
    const pendingTx = existingEarns.find(t => t.source === "order_pending" && t.type === "earn");

    if (!pendingTx) return NextResponse.json({ error: "No pending coins found for this order" }, { status: 404 });

    const wallet = await coinRepo.getOrCreateWallet(user.userId);

    await withTransaction(async () => {
      await coinRepo.updateWalletBalance(wallet.id, -pendingTx.amount, "pendingCoins");
      await coinRepo.updateWalletBalance(wallet.id, pendingTx.amount, "balance");
    });

    await coinRepo.queueNotification({
      userId: user.userId,
      notificationType: "coins_earned",
      title: "Coins Available!",
      body: `${pendingTx.amount} Super Coins are now available in your wallet.`,
      channel: "in_app",
      referenceType: "order",
      referenceId: orderId,
    });

    await checkAndUpgradeTier(user.userId);

    return NextResponse.json({ confirmed: true, amount: pendingTx.amount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 400 });
  }
}
