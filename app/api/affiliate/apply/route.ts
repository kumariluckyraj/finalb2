import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { applyForAffiliate, getAffiliateByUserId } from "@/postgres/repositories/affiliates";
import { query } from "@/postgres/lib/db";

export async function POST() {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await query<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [user.userId]);
  const affiliate = await applyForAffiliate(user.userId, rows[0]?.name ?? "affiliate");
  return NextResponse.json({ affiliate }, { status: 201 });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ affiliate: null });
  const affiliate = await getAffiliateByUserId(user.userId);
  return NextResponse.json({ affiliate });
}