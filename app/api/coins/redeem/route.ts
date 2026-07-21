import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/postgres/repositories/coins";

// How much of an order's value can be paid with coins. Adjust to your policy.
const REDEEM_CAP_PERCENT = 50;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const amount = Number(req.nextUrl.searchParams.get("amount") || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const wallet = await getOrCreateWallet(user.userId);
    const walletBalance = wallet.status === "active" ? wallet.balance : 0;

    const capByPercent = Math.floor((amount * REDEEM_CAP_PERCENT) / 100);
    const maxRedeemable = Math.max(0, Math.min(walletBalance, capByPercent, amount));

    return NextResponse.json({ walletBalance, maxRedeemable });
  } catch (err) {
    console.error("GET /api/coins/redeem failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}