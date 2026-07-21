import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { verifyToken } from "@/lib/jwt";
import { findOrderById, updatePaymentDetails } from "@/postgres/repositories/orders";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);

  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await req.json();

  if (!orderId || !razorpayPaymentId) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // Verify Razorpay payment signature via HMAC SHA256
  if (razorpayOrderId && razorpaySignature) {
    const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    if (expected !== razorpaySignature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 403 });
    }
  }

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "admin" && order.userId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await updatePaymentDetails(orderId, razorpayPaymentId);
  return NextResponse.json({ success: true });
}
