import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAffiliateByUserId, getAffiliateStats } from "@/postgres/repositories/affiliates";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await getAffiliateByUserId(user.userId);
  if (!affiliate) return NextResponse.json({ affiliate: null, stats: null });

  const stats = await getAffiliateStats(affiliate.id);
  return NextResponse.json({ affiliate, stats });
}