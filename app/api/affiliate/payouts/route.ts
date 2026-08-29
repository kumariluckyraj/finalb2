import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAffiliateByUserId, requestPayout, listPayoutsForAffiliate } from "@/postgres/repositories/affiliates";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await getAffiliateByUserId(user.userId);
  if (!affiliate) return NextResponse.json({ payouts: [] });

  const payouts = await listPayoutsForAffiliate(affiliate.id);
  return NextResponse.json({ payouts });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await getAffiliateByUserId(user.userId);
  if (!affiliate || affiliate.status !== "approved") {
    return NextResponse.json({ error: "You must be an approved affiliate" }, { status: 403 });
  }

  const { amount } = await req.json();
  try {
    const payout = await requestPayout(affiliate.id, Number(amount));
    return NextResponse.json({ payout }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Payout request failed" }, { status: 400 });
  }
}