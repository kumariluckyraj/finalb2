import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth";
import {
  getOrCreateWallet,
  updateWalletBalance,
  createTransaction,
  getTransactionByIdempotencyKey,
} from "@/postgres/repositories/coins";

function verifySignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }
    if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Idempotency: never double-credit the same Razorpay payment
    const idempotencyKey = `topup:${razorpayPaymentId}`;
    const existing = await getTransactionByIdempotencyKey(idempotencyKey);
    if (existing) {
      const wallet = await getOrCreateWallet(user.userId);
      return NextResponse.json({ success: true, balance: wallet.balance, alreadyProcessed: true });
    }

    const wallet = await getOrCreateWallet(user.userId);
    const balanceBefore = wallet.balance;
    const updated = await updateWalletBalance(wallet.id, amount, "balance");
    await updateWalletBalance(wallet.id, amount, "lifetimeEarned");

    await createTransaction({
      walletId: wallet.id,
      userId: user.userId,
      type: "earn",
      amount,
      balanceBefore,
      balanceAfter: updated.balance,
      source: "wallet_topup",
      referenceType: "payment",
      referenceId: razorpayPaymentId,
      description: `Purchased ${amount} SuperCoins`,
      idempotencyKey,
    });

    return NextResponse.json({ success: true, balance: updated.balance });
  } catch (err) {
    console.error("POST /api/wallet/topup/verify failed:", err);
    return NextResponse.json({ error: "Failed to verify top-up" }, { status: 500 });
  }
}