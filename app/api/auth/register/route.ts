import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/auth";
import { createUser, findUserByEmail } from "@/postgres/repositories/users";
import { findOtpByPhone } from "@/postgres/repositories/otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10,15}$/;
const MIN_PASSWORD = 8;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, password, role } = body as { name: string; email: string; phone: string; password: string; role: UserRole };

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 characters)" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!phone || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Valid phone number is required (10-15 digits)" }, { status: 400 });
  }

  if (!password || password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
  }

  if (password.toLowerCase() === "password" || password.toLowerCase() === "12345678" || password.toLowerCase() === "qwertyui") {
    return NextResponse.json({ error: "Password is too common. Choose a stronger one." }, { status: 400 });
  }

  if (!["customer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const otpRecord = await findOtpByPhone(phone);
  if (!otpRecord || !otpRecord.verified) {
    return NextResponse.json({ error: "Phone number not verified via OTP" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await createUser({ name, email, phone, password: hashed, role });

  return NextResponse.json({ message: "Registered successfully" }, { status: 201 });
}
