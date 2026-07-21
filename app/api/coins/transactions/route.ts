import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getTransactionHistory } from "@/lib/coins/wallet-service";
import type { TransactionType } from "@/postgres/models/Coin";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const type = searchParams.get("type") as TransactionType | undefined;

  const transactions = await getTransactionHistory(user.userId, { limit, offset, type });
  return NextResponse.json({ transactions });
}
