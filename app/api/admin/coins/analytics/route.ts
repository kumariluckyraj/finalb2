import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const analytics = await coinRepo.getWalletAnalytics();
  const topUsers = await coinRepo.getTopUsers(20);

  const { query } = await import("@/postgres/lib/db");
  const campaigns = await query<any>(
    `SELECT id, name, campaign_type AS "campaignType", budget_coins AS "budgetCoins",
       coins_awarded AS "coinsAwarded", status
     FROM campaigns ORDER BY coins_awarded DESC LIMIT 10`
  );

  const txSummary = await query<any>(
    `SELECT type, COUNT(*)::int AS count, SUM(amount)::int AS total
     FROM wallet_transactions
     WHERE created_at >= now() - interval '30 days'
     GROUP BY type ORDER BY total DESC`
  );

  return NextResponse.json({
    analytics,
    topUsers,
    topCampaigns: campaigns.rows,
    last30Days: txSummary.rows,
  });
}
