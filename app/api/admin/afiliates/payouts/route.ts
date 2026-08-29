import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listAllPayouts } from "@/postgres/repositories/affiliates";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.userId || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const payouts = await listAllPayouts(status);
  return NextResponse.json({ payouts });
}