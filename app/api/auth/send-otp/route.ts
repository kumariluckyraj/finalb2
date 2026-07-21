import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/sms";
import { upsertOtp } from "@/postgres/repositories/otp";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || typeof phone !== "string" || !/^\d{10,15}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`otp:${phone}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  if (!rateLimit(`otp:ip:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const bypassOtp = process.env.BYPASS_OTP === "true";
  const otp = bypassOtp ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    await upsertOtp({ phone, otp, expiresAt, verified: false });

    if (bypassOtp) {
      console.log(`[BYPASS] OTP generated (check server logs)`);
    } else {
      await sendOTP(phone, otp);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
