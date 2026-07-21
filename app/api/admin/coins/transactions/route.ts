import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { query } = await import("@/postgres/lib/db");

  const conditions = ["1=1"];
  const params: unknown[] = [];
  if (userId) { conditions.push(`wt.user_id = $${params.length + 1}`); params.push(userId); }
  if (type) { conditions.push(`wt.type = $${params.length + 1}`); params.push(type); }

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM wallet_transactions wt WHERE ${conditions.join(" AND ")}`,
    params
  );

  const { rows } = await query<any>(
    `SELECT wt.id, wt.wallet_id AS "walletId", wt.user_id AS "userId", u.name AS "userName", u.email,
       wt.type, wt.amount, wt.balance_before AS "balanceBefore", wt.balance_after AS "balanceAfter",
       wt.source, wt.reference_type AS "referenceType", wt.reference_id AS "referenceId",
       wt.description, wt.created_at AS "createdAt"
     FROM wallet_transactions wt
     JOIN users u ON u.id = wt.user_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY wt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return NextResponse.json({ transactions: rows, total: parseInt(countResult.rows[0]?.count ?? "0", 10) });
}
