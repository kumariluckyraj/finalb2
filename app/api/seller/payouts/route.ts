import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listPayoutsBySeller, getSellerPayoutSummary, findPayoutById, getPayoutTransactions } from "@/postgres/repositories/payouts";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const url = new URL(req.url);
  const payoutId = url.searchParams.get("payoutId");

  if (payoutId) {
    const payout = await findPayoutById(payoutId);
    const transactions = await getPayoutTransactions(payoutId);
    return NextResponse.json({ payout, transactions });
  }

  const payouts = await listPayoutsBySeller(profile.id);
  const summary = await getSellerPayoutSummary(profile.id);

  return NextResponse.json({ payouts, summary });
}
