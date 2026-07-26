import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { findUserByEmail } from "@/postgres/repositories/users";
import { rateLimit } from "@/lib/rateLimit";

const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN;
const ADMIN_ROLES = ["admin", "sub_admin"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`login:ip:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { email, password } = await req.json();

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (!rateLimit(`login:email:${email}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const hostname = (req.headers.get("host") || "").split(":")[0];
  const isAdminDomain = ADMIN_DOMAIN && hostname === ADMIN_DOMAIN;
  const isAdminRole = ADMIN_ROLES.includes(user.role);

  if (isAdminDomain && !isAdminRole) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (isAdminRole && ADMIN_DOMAIN && !isAdminDomain) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, email: user.email, role: user.role });

  const response = NextResponse.json({ message: "Login successful", role: user.role });
  response.cookies.delete("token");
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}