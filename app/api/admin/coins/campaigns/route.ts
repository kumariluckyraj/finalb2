import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";
import { createAuditLog } from "@/postgres/repositories/coins";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { rows } = await (await import("@/postgres/lib/db")).query<any>(
    `SELECT id, name, description, campaign_type AS "campaignType",
       config, start_date AS "startDate", end_date AS "endDate",
       budget_coins AS "budgetCoins", coins_awarded AS "coinsAwarded",
       max_per_user AS "maxPerUser", status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM campaigns ORDER BY created_at DESC`
  );
  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const campaign = await coinRepo.createCampaign({
      name: body.name,
      description: body.description ?? "",
      campaignType: body.campaignType,
      config: body.config ?? {},
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      budgetCoins: body.budgetCoins ?? 0,
      maxPerUser: body.maxPerUser ?? 0,
      status: body.status ?? "draft",
    });

    await createAuditLog({
      adminId: user.userId,
      action: "create_campaign",
      resourceType: "campaign",
      resourceId: campaign.id,
      details: { name: body.name },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { query } = await import("@/postgres/lib/db");
    const { rows } = await query<any>(
      `UPDATE campaigns SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, name, status`,
      [body.campaignId, body.status]
    );
    if (!rows[0]) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    await createAuditLog({
      adminId: user.userId,
      action: "update_campaign_status",
      resourceType: "campaign",
      resourceId: body.campaignId,
      details: { status: body.status },
    });

    return NextResponse.json({ campaign: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
