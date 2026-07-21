import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { getOrCreateWallet } from "@/postgres/repositories/coins";

const MIN_TOPUP = 10;
const MAX_TOPUP = 50000;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount } = await req.json();
    if (!Number.isInteger(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return NextResponse.json(
        { error: `Amount must be between ₹${MIN_TOPUP} and ₹${MAX_TOPUP}` },
        { status: 400 }
      );
    }

    const wallet = await getOrCreateWallet(user.userId);
    if (wallet.status === "frozen") {
      return NextResponse.json({ error: "Wallet is frozen" }, { status: 403 });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `topup_${user.userId}_${Date.now()}`.slice(0, 40),
      notes: { purpose: "supercoins_topup", userId: user.userId, coins: String(amount) },
    });

    return NextResponse.json({
      success: true,
      amount,
      razorpayOrderId: rzpOrder.id,
      currency: rzpOrder.currency,
    });
  } catch (err) {
    console.error("POST /api/wallet/topup failed:", err);
    return NextResponse.json({ error: "Failed to initiate top-up" }, { status: 500 });
  }
}