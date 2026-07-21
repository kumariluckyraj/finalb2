import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { PayoutRecord, PayoutStatus, PayoutTransactionRecord } from "../models/Payout";

const payoutSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    period_start AS "periodStart",
    period_end AS "periodEnd",
    gross_sales AS "grossSales",
    total_commission AS "totalCommission",
    total_shipping_deductions AS "totalShippingDeductions",
    total_taxes AS "totalTaxes",
    total_refunds AS "totalRefunds",
    net_amount AS "netAmount",
    status,
    payout_provider AS "payoutProvider",
    payout_reference AS "payoutReference",
    paid_at AS "paidAt",
    invoice_url AS "invoiceUrl",
    notes,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM payouts
`;

export async function listPayoutsBySeller(sellerId: string): Promise<PayoutRecord[]> {
  const { rows } = await query<PayoutRecord>(`${payoutSelect} WHERE seller_id = $1 ORDER BY period_start DESC`, [sellerId]);
  return rows;
}

export async function findPayoutById(id: string): Promise<PayoutRecord | null> {
  const { rows } = await query<PayoutRecord>(`${payoutSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getPayoutTransactions(payoutId: string): Promise<PayoutTransactionRecord[]> {
  const { rows } = await query<PayoutTransactionRecord>(
    `SELECT id, payout_id AS "payoutId", seller_order_id AS "sellerOrderId", type, amount, description, created_at AS "createdAt" FROM payout_transactions WHERE payout_id = $1 ORDER BY created_at ASC`,
    [payoutId]
  );
  return rows;
}

export async function getSellerPayoutSummary(sellerId: string): Promise<{ grossSales: number; netAmount: number; pendingPayout: number }> {
  const { rows } = await query<Record<string, unknown>>(
    `
      SELECT
        COALESCE(SUM(gross_sales), 0)::float8 AS "grossSales",
        COALESCE(SUM(net_amount), 0)::float8 AS "netAmount",
        COALESCE(SUM(net_amount) FILTER (WHERE status IN ('pending', 'processing')), 0)::float8 AS "pendingPayout"
      FROM payouts
      WHERE seller_id = $1
    `,
    [sellerId]
  );
  const row = rows[0];
  return {
    grossSales: Number(row.grossSales),
    netAmount: Number(row.netAmount),
    pendingPayout: Number(row.pendingPayout),
  };
}

export async function createPayout(input: {
  sellerId: string;
  periodStart: Date;
  periodEnd: Date;
  grossSales: number;
  totalCommission: number;
  totalShippingDeductions: number;
  totalTaxes: number;
  totalRefunds: number;
  netAmount: number;
  notes?: string;
}): Promise<PayoutRecord> {
  const { rows } = await query<PayoutRecord>(
    `
      INSERT INTO payouts (id, seller_id, period_start, period_end, gross_sales, total_commission, total_shipping_deductions, total_taxes, total_refunds, net_amount, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
      RETURNING id, seller_id AS "sellerId", period_start AS "periodStart", period_end AS "periodEnd", gross_sales AS "grossSales", total_commission AS "totalCommission", total_shipping_deductions AS "totalShippingDeductions", total_taxes AS "totalTaxes", total_refunds AS "totalRefunds", net_amount AS "netAmount", status, payout_provider AS "payoutProvider", payout_reference AS "payoutReference", paid_at AS "paidAt", invoice_url AS "invoiceUrl", notes, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [randomUUID(), input.sellerId, input.periodStart, input.periodEnd, input.grossSales, input.totalCommission, input.totalShippingDeductions, input.totalTaxes, input.totalRefunds, input.netAmount, input.notes ?? null]
  );
  return rows[0];
}

export async function updatePayoutStatus(id: string, status: PayoutStatus, payoutReference?: string): Promise<PayoutRecord | null> {
  const paidAtClause = status === "paid" ? `, paid_at = now()` : "";
  const refClause = payoutReference ? `, payout_reference = $3` : "";
  const params: unknown[] = [id, status];
  if (payoutReference) params.push(payoutReference);

  const { rows } = await query<PayoutRecord>(
    `UPDATE payouts SET status = $2${paidAtClause}${refClause}, updated_at = now() WHERE id = $1
     RETURNING id, seller_id AS "sellerId", period_start AS "periodStart", period_end AS "periodEnd", gross_sales AS "grossSales", total_commission AS "totalCommission", total_shipping_deductions AS "totalShippingDeductions", total_taxes AS "totalTaxes", total_refunds AS "totalRefunds", net_amount AS "netAmount", status, payout_provider AS "payoutProvider", payout_reference AS "payoutReference", paid_at AS "paidAt", invoice_url AS "invoiceUrl", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    params
  );
  return rows[0] ?? null;
}

export async function createPayoutTransaction(input: {
  payoutId: string;
  sellerOrderId?: string;
  type: "sale" | "commission" | "shipping" | "tax" | "refund" | "adjustment";
  amount: number;
  description?: string;
}): Promise<PayoutTransactionRecord> {
  const { rows } = await query<PayoutTransactionRecord>(
    `INSERT INTO payout_transactions (id, payout_id, seller_order_id, type, amount, description) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, payout_id AS "payoutId", seller_order_id AS "sellerOrderId", type, amount, description, created_at AS "createdAt"`,
    [randomUUID(), input.payoutId, input.sellerOrderId ?? null, input.type, input.amount, input.description ?? null]
  );
  return rows[0];
}

export async function listAllPayouts(status?: string): Promise<(PayoutRecord & { businessName?: string })[]> {
  let sql = `${payoutSelect} LEFT JOIN seller_profiles sp ON sp.id = payouts.seller_id`;
  const params: unknown[] = [];
  if (status) {
    sql += ` WHERE payouts.status = $1`;
    params.push(status);
  }
  sql += ` ORDER BY payouts.created_at DESC LIMIT 200`;

  const { rows } = await query<any>(sql, params);
  return rows.map(r => ({ ...r, businessName: r.businessName || null }));
}

export async function getPendingPayoutData(): Promise<{ sellerId: string; grossSales: number; totalCommission: number; netAmount: number; orderCount: number }[]> {
  const { rows } = await query<any>(
    `
    SELECT
      so.seller_id AS "sellerId",
      COALESCE(SUM(so.total_price), 0)::float8 AS "grossSales",
      COALESCE(SUM(so.commission_amount), 0)::float8 AS "totalCommission",
      COALESCE(SUM(so.net_amount), 0)::float8 AS "netAmount",
      COUNT(*)::int AS "orderCount"
    FROM seller_orders so
    WHERE so.status = 'delivered'
      AND NOT EXISTS (
        SELECT 1 FROM payout_transactions pt
        JOIN payouts p ON p.id = pt.payout_id
        WHERE pt.seller_order_id = so.id AND p.status NOT IN ('cancelled', 'failed')
      )
    GROUP BY so.seller_id
    `,
    []
  );
  return rows;
}
