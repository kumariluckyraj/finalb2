import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";
import { createAuditLog } from "@/postgres/repositories/coins";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { query } = await import("@/postgres/lib/db");
  const { rows } = await query<any>(
    `SELECT id, rule_key AS "ruleKey", name, description, rule_type AS "ruleType",
       config, is_active AS "isActive", priority, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM coin_rules ORDER BY rule_type, priority DESC`
  );
  const redemptionRules = await coinRepo.getRedemptionRules();
  return NextResponse.json({ coinRules: rows, redemptionRules });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { query } = await import("@/postgres/lib/db");

    if (body.ruleId) {
      const { rows } = await query<any>(
        `UPDATE coin_rules SET config = $2::jsonb, is_active = $3, priority = $4, updated_at = now()
         WHERE id = $1 RETURNING id, rule_key AS "ruleKey"`,
        [body.ruleId, JSON.stringify(body.config ?? {}), body.isActive ?? true, body.priority ?? 0]
      );
      if (!rows[0]) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

      await createAuditLog({
        adminId: user.userId,
        action: "update_coin_rule",
        resourceType: "coin_rule",
        resourceId: body.ruleId,
        details: { ruleKey: rows[0].ruleKey },
      });
      return NextResponse.json({ rule: rows[0] });
    }

    return NextResponse.json({ error: "ruleId required" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
