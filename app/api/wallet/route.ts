import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getOrCreateWallet, getTransactions } from "@/postgres/repositories/coins";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await getOrCreateWallet(user.userId);
  const transactions = await getTransactions(user.userId, { limit: 30 });

  return NextResponse.json({
    balance: wallet.balance,
    lifetimeEarned: wallet.lifetimeEarned,
    lifetimeSpent: wallet.lifetimeSpent,
    status: wallet.status,
    transactions,
  });
}