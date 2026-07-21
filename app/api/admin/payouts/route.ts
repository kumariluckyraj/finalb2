import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listAllPayouts, findPayoutById, getPayoutTransactions, getPendingPayoutData, createPayout, createPayoutTransaction, updatePayoutStatus } from "@/postgres/repositories/payouts";
import { query } from "@/postgres/lib/db";
import { randomUUID } from "node:crypto";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const payoutId = url.searchParams.get("payoutId");

  if (payoutId) {
    const payout = await findPayoutById(payoutId);
    if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const transactions = await getPayoutTransactions(payoutId);
    return NextResponse.json({ payout, transactions });
  }

  const status = url.searchParams.get("status") || undefined;
  const payouts = await listAllPayouts(status);

  const { rows } = await query<any>(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(net_amount), 0)::float8 AS totalPending
     FROM payouts WHERE status IN ('pending', 'processing')`
  );

  return NextResponse.json({ payouts, pendingCount: rows[0]?.count ?? 0, totalPending: rows[0]?.totalPending ?? 0 });
}

export async function POST() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pendingData = await getPendingPayoutData();

  let created = 0;
  for (const data of pendingData) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payout = await createPayout({
      sellerId: data.sellerId,
      periodStart,
      periodEnd,
      grossSales: data.grossSales,
      totalCommission: data.totalCommission,
      totalShippingDeductions: 0,
      totalTaxes: 0,
      totalRefunds: 0,
      netAmount: data.netAmount,
      notes: `Auto-generated from ${data.orderCount} delivered orders`,
    });

    await createPayoutTransaction({
      payoutId: payout.id,
      type: "sale",
      amount: data.grossSales,
      description: `Sales from ${data.orderCount} delivered orders`,
    });

    if (data.totalCommission > 0) {
      await createPayoutTransaction({
        payoutId: payout.id,
        type: "commission",
        amount: -data.totalCommission,
        description: "Platform commission deducted",
      });
    }

    created++;
  }

  return NextResponse.json({ success: true, created });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { payoutId, status, payoutReference } = body;

  if (!payoutId || !status) return NextResponse.json({ error: "payoutId and status required" }, { status: 400 });

  const payout = await updatePayoutStatus(payoutId, status, payoutReference);
  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, payout });
}
