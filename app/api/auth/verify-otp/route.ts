import { NextRequest, NextResponse } from "next/server";
import { findOtpByPhone, markOtpVerified } from "@/postgres/repositories/otp";

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();
  const record = await findOtpByPhone(phone);
  if (!record || record.otp !== otp || record.expiresAt < new Date())
    return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 });
  await markOtpVerified(phone);
  return NextResponse.json({ success: true });
}
