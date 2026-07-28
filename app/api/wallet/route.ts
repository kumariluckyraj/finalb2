import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getOrCreateWallet, getTransactions, getExpiringCoinsSummary } from "@/postgres/repositories/coins";
import { expireUserCoins } from "@/lib/coins/wallet-service";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await expireUserCoins(user.userId); // keep displayed balance in sync with expiry

  const wallet = await getOrCreateWallet(user.userId);
  const transactions = await getTransactions(user.userId, { limit: 30 });
  const expiringSoon = await getExpiringCoinsSummary(user.userId);

  return NextResponse.json({
    balance: wallet.balance,
    lifetimeEarned: wallet.lifetimeEarned,
    lifetimeSpent: wallet.lifetimeSpent,
    status: wallet.status,
    transactions,
    expiringSoon,
  });
}