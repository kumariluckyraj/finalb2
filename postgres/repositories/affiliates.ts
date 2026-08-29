import { randomUUID } from "node:crypto";
import { query } from "../lib/db";

export interface AffiliateRecord {
  id: string;
  userId: string;
  code: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  commissionPercent: number;
  createdAt: Date;
}

function slugifyBase(name: string): string {
  return (name || "AFF").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "AFF";
}

async function generateUniqueCode(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const { rows } = await query(`SELECT 1 FROM affiliates WHERE code = $1`, [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  throw new Error("Could not generate a unique affiliate code");
}

export async function applyForAffiliate(userId: string, userName: string, requestedCode?: string): Promise<AffiliateRecord> {
  const existing = await getAffiliateByUserId(userId);
  if (existing) return existing;

  const base = requestedCode ? slugifyBase(requestedCode) : slugifyBase(userName);
  const code = await generateUniqueCode(base);

  const { rows } = await query<AffiliateRecord>(
    `INSERT INTO affiliates (id, user_id, code, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id, user_id AS "userId", code, status, commission_percent::float8 AS "commissionPercent", created_at AS "createdAt"`,
    [randomUUID(), userId, code]
  );
  return rows[0];
}

export async function getAffiliateByUserId(userId: string): Promise<AffiliateRecord | null> {
  const { rows } = await query<AffiliateRecord>(
    `SELECT id, user_id AS "userId", code, status, commission_percent::float8 AS "commissionPercent", created_at AS "createdAt"
     FROM affiliates WHERE user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function getAffiliateByCode(code: string): Promise<AffiliateRecord | null> {
  const { rows } = await query<AffiliateRecord>(
    `SELECT id, user_id AS "userId", code, status, commission_percent::float8 AS "commissionPercent", created_at AS "createdAt"
     FROM affiliates WHERE code = $1`,
    [code.toUpperCase()]
  );
  return rows[0] ?? null;
}

export async function recordClick(affiliateId: string, landingPath: string, referrer?: string, visitorId?: string): Promise<void> {
  await query(
    `INSERT INTO affiliate_clicks (id, affiliate_id, landing_path, referrer, visitor_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), affiliateId, landingPath, referrer ?? null, visitorId ?? null]
  );
}

export async function listAffiliates(status?: string) {
  const { rows } = await query(
    status
      ? `SELECT a.id, a.code, a.status, a.commission_percent::float8 AS "commissionPercent", a.created_at AS "createdAt",
                u.name AS "userName", u.email AS "userEmail"
         FROM affiliates a JOIN users u ON u.id = a.user_id
         WHERE a.status = $1 ORDER BY a.created_at DESC`
      : `SELECT a.id, a.code, a.status, a.commission_percent::float8 AS "commissionPercent", a.created_at AS "createdAt",
                u.name AS "userName", u.email AS "userEmail"
         FROM affiliates a JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC`,
    status ? [status] : []
  );
  return rows;
}

export async function setAffiliateStatus(affiliateId: string, status: "approved" | "rejected" | "suspended", commissionPercent?: number): Promise<void> {
  await query(
    `UPDATE affiliates
     SET status = $2,
         commission_percent = COALESCE($3, commission_percent),
         approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE approved_at END,
         updated_at = now()
     WHERE id = $1`,
    [affiliateId, status, commissionPercent ?? null]
  );
}

export async function getAffiliateStats(affiliateId: string) {
  const { rows: clickRows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM affiliate_clicks WHERE affiliate_id = $1`,
    [affiliateId]
  );
  const { rows: commissionRows } = await query<{ status: string; total: number; count: number }>(
    `SELECT status, COALESCE(SUM(commission_amount), 0)::float8 AS total, COUNT(*)::int AS count
     FROM affiliate_commissions WHERE affiliate_id = $1 GROUP BY status`,
    [affiliateId]
  );
  const { rows: paidOutRows } = await query<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM affiliate_payouts
     WHERE affiliate_id = $1 AND status IN ('requested', 'processing', 'paid')`,
    [affiliateId]
  );

  const byStatus = Object.fromEntries(commissionRows.map(r => [r.status, { total: r.total, count: r.count }]));
  const approvedTotal = byStatus.approved?.total ?? 0;
  const alreadyRequestedOrPaid = paidOutRows[0]?.total ?? 0;

  return {
    clicks: clickRows[0]?.count ?? 0,
    commissions: {
      pending: byStatus.pending ?? { total: 0, count: 0 },
      approved: byStatus.approved ?? { total: 0, count: 0 },
      paid: byStatus.paid ?? { total: 0, count: 0 },
      cancelled: byStatus.cancelled ?? { total: 0, count: 0 },
    },
    availableForPayout: Math.max(0, approvedTotal - alreadyRequestedOrPaid),
  };
}

export async function requestPayout(affiliateId: string, amount: number) {
  const stats = await getAffiliateStats(affiliateId);
  if (amount <= 0 || amount > stats.availableForPayout) {
    throw new Error(`Requested amount exceeds available balance of ₹${stats.availableForPayout.toFixed(2)}`);
  }
  const { rows } = await query(
    `INSERT INTO affiliate_payouts (id, affiliate_id, amount, status)
     VALUES ($1, $2, $3, 'requested')
     RETURNING id, affiliate_id AS "affiliateId", amount::float8 AS amount, status, requested_at AS "requestedAt"`,
    [randomUUID(), affiliateId, amount]
  );
  return rows[0];
}

export async function listPayoutsForAffiliate(affiliateId: string) {
  const { rows } = await query(
    `SELECT id, amount::float8 AS amount, status, notes, requested_at AS "requestedAt", paid_at AS "paidAt"
     FROM affiliate_payouts WHERE affiliate_id = $1 ORDER BY requested_at DESC`,
    [affiliateId]
  );
  return rows;
}

export async function listAllPayouts(status?: string) {
  const { rows } = await query(
    status
      ? `SELECT p.id, p.amount::float8 AS amount, p.status, p.notes, p.requested_at AS "requestedAt", p.paid_at AS "paidAt",
                a.code AS "affiliateCode", u.name AS "userName", u.email AS "userEmail"
         FROM affiliate_payouts p
         JOIN affiliates a ON a.id = p.affiliate_id
         JOIN users u ON u.id = a.user_id
         WHERE p.status = $1 ORDER BY p.requested_at DESC`
      : `SELECT p.id, p.amount::float8 AS amount, p.status, p.notes, p.requested_at AS "requestedAt", p.paid_at AS "paidAt",
                a.code AS "affiliateCode", u.name AS "userName", u.email AS "userEmail"
         FROM affiliate_payouts p
         JOIN affiliates a ON a.id = p.affiliate_id
         JOIN users u ON u.id = a.user_id
         ORDER BY p.requested_at DESC`,
    status ? [status] : []
  );
  return rows;
}

export async function updatePayoutStatus(payoutId: string, status: "processing" | "paid" | "rejected", notes?: string): Promise<void> {
  await query(
    `UPDATE affiliate_payouts
     SET status = $2, notes = COALESCE($3, notes), paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE paid_at END
     WHERE id = $1`,
    [payoutId, status, notes ?? null]
  );
}