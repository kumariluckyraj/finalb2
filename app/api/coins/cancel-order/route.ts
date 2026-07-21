import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";
import { withTransaction } from "@/postgres/lib/db";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { orderId, isRefund } = body;
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const existingEarns = await coinRepo.getTransactionsByReference("order", orderId);
    const pendingTx = existingEarns.find(t => t.source === "order_pending" && t.type === "earn");

    if (pendingTx) {
      const wallet = await coinRepo.getOrCreateWallet(user.userId);
      await withTransaction(async () => {
        await coinRepo.updateWalletBalance(wallet.id, -pendingTx.amount, "pendingCoins");
        await coinRepo.createTransaction({
          walletId: wallet.id,
          userId: user.userId,
          type: "reversal",
          amount: pendingTx.amount,
          balanceBefore: wallet.balance + wallet.pendingCoins,
          balanceAfter: wallet.balance + wallet.pendingCoins - pendingTx.amount,
          source: "order_cancelled",
          referenceType: "order",
          referenceId: orderId,
          description: `Pending coins reversed for cancelled order #${orderId}`,
        });
      });
      return NextResponse.json({ reversed: true, amount: pendingTx.amount });
    }

    if (isRefund) {
      const { refundCoins } = await import("@/lib/coins/wallet-service");
      const result = await refundCoins(user.userId, "order", orderId);
      return NextResponse.json({ refunded: true, amount: result?.amount ?? 0 });
    }

    return NextResponse.json({ reversed: false, amount: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 400 });
  }
}
