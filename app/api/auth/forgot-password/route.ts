import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/postgres/repositories/users";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ message: "If that email exists, we have sent a password reset link." }, { status: 200 });
    }

    // In a real application, we would generate a secure token here and send an email using an SMTP service like SendGrid, Resend, or AWS SES.
    // Since we don't have an email service configured in this demo, we simulate success.
    // The frontend will advance to the reset password screen automatically for UX testing.
    
    return NextResponse.json({ message: "If that email exists, we have sent a password reset link." }, { status: 200 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
