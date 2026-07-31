import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { verifyToken } from "@/lib/jwt";
import { findOrderById, updatePaymentDetails } from "@/postgres/repositories/orders";
import { findCouponById } from "@/postgres/repositories/coupons";
import { razorpay } from "@/lib/razorpay";
import { query } from "@/postgres/lib/db";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Map Razorpay's wallet identifiers to your admin-panel bank codes
const WALLET_TO_BANK_CODE: Record<string, string> = {
  airtelpaymentsbank: "Airtel Payments Bank",
};

function resolvePaidBankCode(payment: any): string | null {
  if (payment.method === "netbanking" && payment.bank) return payment.bank; // e.g. "HDFC"
  if (payment.method === "card" && payment.card?.issuer) return payment.card.issuer;
  if (payment.method === "wallet" && payment.wallet) {
    return WALLET_TO_BANK_CODE[payment.wallet.toLowerCase()] ?? null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

  if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // Signature verification is now mandatory — no silent skip
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  if (expected !== razorpaySignature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 403 });
  }

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && order.userId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Extra safety: the order's stored razorpay_order_id must match what was signed
  if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 403 });
  }

  await updatePaymentDetails(orderId, razorpayPaymentId);

  // ── Bank-restricted coupon check ──────────────────────────────────────────
  const pending = await query<{ pendingCouponId: string | null; pendingCouponDiscount: number }>(
    `SELECT pending_coupon_id AS "pendingCouponId", pending_coupon_discount::float8 AS "pendingCouponDiscount"
     FROM orders WHERE id = $1`,
    [orderId]
  );
  const pendingCouponId = pending.rows[0]?.pendingCouponId;
  const pendingDiscount = pending.rows[0]?.pendingCouponDiscount ?? 0;

  if (pendingCouponId && pendingDiscount > 0) {
    try {
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      const paidBankCode = resolvePaidBankCode(payment);
      const coupon = await findCouponById(pendingCouponId);

      if (coupon && paidBankCode && coupon.bankCodes?.includes(paidBankCode)) {
        // Match — refund the discount and record usage
        await razorpay.payments.refund(razorpayPaymentId, {
          amount: Math.round(pendingDiscount * 100),
        });

        await query(
          `UPDATE orders SET total_amount = GREATEST(0, total_amount - $2),
                              pending_coupon_id = NULL, pending_coupon_discount = 0, updated_at = now()
           WHERE id = $1`,
          [orderId, pendingDiscount]
        );

        await query(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [pendingCouponId]);
        await query(
          `INSERT INTO coupon_usage (id, coupon_id, user_id, order_id, used_count, last_used_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, 1, now())
           ON CONFLICT (coupon_id, user_id) DO UPDATE SET
             used_count = coupon_usage.used_count + 1, order_id = $3, last_used_at = now()`,
          [pendingCouponId, user.userId, orderId]
        );
      } else {
        // No match — clear the pending coupon, customer stays at full price
        await query(
          `UPDATE orders SET pending_coupon_id = NULL, pending_coupon_discount = 0, updated_at = now() WHERE id = $1`,
          [orderId]
        );
      }
    } catch (err) {
      console.error("Bank-coupon verification/refund failed:", err);
      // Don't fail the whole payment confirmation over a coupon issue —
      // just leave the pending coupon uncleared for manual review, or clear it, per your preference.
    }
  }

  return NextResponse.json({ success: true });
}