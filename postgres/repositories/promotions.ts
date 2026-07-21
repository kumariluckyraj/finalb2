import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { PromotionRecord, PromotionType, PromotionUsageRecord } from "../models/Promotion";

const promoSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    store_id AS "storeId",
    type,
    title,
    description,
    code,
    discount_type AS "discountType",
    discount_value AS "discountValue",
    min_order_value AS "minOrderValue",
    max_discount_amount AS "maxDiscountAmount",
    bundle_product_ids AS "bundleProductIds",
    bundle_price AS "bundlePrice",
    applicable_categories AS "applicableCategories",
    applicable_products AS "applicableProducts",
    per_user_limit AS "perUserLimit",
    starts_at AS "startsAt",
    ends_at AS "endsAt",
    usage_limit AS "usageLimit",
    usage_count AS "usageCount",
    is_active AS "isActive",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM promotions
`;

const promoReturning = `
  RETURNING id, seller_id AS "sellerId", store_id AS "storeId", type, title, description, code,
    discount_type AS "discountType", discount_value AS "discountValue",
    min_order_value AS "minOrderValue", max_discount_amount AS "maxDiscountAmount",
    bundle_product_ids AS "bundleProductIds", bundle_price AS "bundlePrice",
    applicable_categories AS "applicableCategories", applicable_products AS "applicableProducts",
    per_user_limit AS "perUserLimit",
    starts_at AS "startsAt", ends_at AS "endsAt",
    usage_limit AS "usageLimit", usage_count AS "usageCount",
    is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function createPromotion(input: {
  sellerId: string; storeId?: string; type: PromotionType; title: string; description?: string;
  code?: string; discountType?: "percentage" | "fixed"; discountValue?: number;
  minOrderValue?: number; maxDiscountAmount?: number; bundleProductIds?: string[];
  bundlePrice?: number; applicableCategories?: string[]; applicableProducts?: string[];
  perUserLimit?: number; startsAt: Date; endsAt: Date; usageLimit?: number;
}): Promise<PromotionRecord> {
  const { rows } = await query<PromotionRecord>(
    `INSERT INTO promotions (id, seller_id, store_id, type, title, description, code, discount_type, discount_value, min_order_value, max_discount_amount, bundle_product_ids, bundle_price, applicable_categories, applicable_products, per_user_limit, starts_at, ends_at, usage_limit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)${promoReturning}`,
    [
      randomUUID(), input.sellerId, input.storeId ?? null, input.type, input.title,
      input.description ?? null, input.code ?? null, input.discountType ?? null,
      input.discountValue ?? null, input.minOrderValue ?? null, input.maxDiscountAmount ?? null,
      JSON.stringify(input.bundleProductIds ?? []), input.bundlePrice ?? null,
      JSON.stringify(input.applicableCategories ?? []), JSON.stringify(input.applicableProducts ?? []),
      input.perUserLimit ?? 1,
      input.startsAt, input.endsAt, input.usageLimit ?? null,
    ]
  );
  return rows[0];
}

export async function updatePromotion(id: string, input: {
  title?: string; description?: string; discountType?: "percentage" | "fixed";
  discountValue?: number; minOrderValue?: number; maxDiscountAmount?: number;
  bundleProductIds?: string[]; bundlePrice?: number;
  applicableCategories?: string[]; applicableProducts?: string[];
  perUserLimit?: number; startsAt?: Date; endsAt?: Date; usageLimit?: number;
}): Promise<PromotionRecord | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const cols: Record<string, unknown> = {
    title: input.title, description: input.description,
    discount_type: input.discountType, discount_value: input.discountValue,
    min_order_value: input.minOrderValue, max_discount_amount: input.maxDiscountAmount,
    bundle_product_ids: input.bundleProductIds ? JSON.stringify(input.bundleProductIds) : undefined,
    bundle_price: input.bundlePrice,
    applicable_categories: input.applicableCategories ? JSON.stringify(input.applicableCategories) : undefined,
    applicable_products: input.applicableProducts ? JSON.stringify(input.applicableProducts) : undefined,
    per_user_limit: input.perUserLimit,
    starts_at: input.startsAt, ends_at: input.endsAt, usage_limit: input.usageLimit,
  };
  let idx = 1;
  for (const [col, val] of Object.entries(cols)) {
    if (val !== undefined) { sets.push(`${col} = $${idx++}`); params.push(val); }
  }
  if (sets.length === 0) return null;
  sets.push(`updated_at = now()`);
  params.push(id);
  const { rows } = await query<PromotionRecord>(
    `UPDATE promotions SET ${sets.join(", ")} WHERE id = $${idx}${promoReturning}`,
    params
  );
  return rows[0] ?? null;
}

export async function listPromotionsBySeller(sellerId: string): Promise<PromotionRecord[]> {
  const { rows } = await query<PromotionRecord>(`${promoSelect} WHERE seller_id = $1 ORDER BY created_at DESC`, [sellerId]);
  return rows;
}

export async function findPromotionByCode(code: string): Promise<PromotionRecord | null> {
  const { rows } = await query<PromotionRecord>(`${promoSelect} WHERE code = $1 AND is_active = true AND starts_at <= now() AND ends_at >= now()`, [code]);
  return rows[0] ?? null;
}

export async function incrementPromotionUsage(id: string): Promise<void> {
  await query(`UPDATE promotions SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [id]);
}

export async function togglePromotionStatus(id: string, isActive: boolean): Promise<PromotionRecord | null> {
  const { rows } = await query<PromotionRecord>(
    `UPDATE promotions SET is_active = $2, updated_at = now() WHERE id = $1${promoReturning}`,
    [id, isActive]
  );
  return rows[0] ?? null;
}

export async function recordPromotionUsage(promotionId: string, userId: string, orderId?: string): Promise<void> {
  await query(
    `INSERT INTO promotion_usage (id, promotion_id, user_id, order_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (promotion_id, user_id) DO UPDATE SET used_count = promotion_usage.used_count + 1, last_used_at = now()`,
    [randomUUID(), promotionId, userId, orderId ?? null]
  );
}

export async function getUserPromotionUsage(promotionId: string, userId: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COALESCE(used_count, 0)::text AS count FROM promotion_usage WHERE promotion_id = $1 AND user_id = $2`,
    [promotionId, userId]
  );
  return rows[0] ? parseInt(rows[0].count) : 0;
}

export async function getPromotionAnalytics(sellerId: string): Promise<{
  totalPromotions: number;
  activeCount: number;
  totalUsage: number;
  byType: { type: string; count: number; usage: number }[];
  topPerforming: { id: string; title: string; type: string; usageCount: number; usageLimit: number | null }[];
}> {
  const total = await query<{ total: string; active: string; usage: string }>(
    `SELECT COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE is_active)::text AS active,
            COALESCE(SUM(usage_count), 0)::text AS usage
     FROM promotions WHERE seller_id = $1`, [sellerId]
  );
  const byType = await query<{ type: string; count: string; usage: string }>(
    `SELECT type, COUNT(*)::text AS count, COALESCE(SUM(usage_count), 0)::text AS usage
     FROM promotions WHERE seller_id = $1 GROUP BY type ORDER BY usage DESC`, [sellerId]
  );
  const top = await query<{ id: string; title: string; type: string; usageCount: string; usageLimit: string | null }>(
    `SELECT id, title, type, usage_count::text AS "usageCount", usage_limit::text AS "usageLimit"
     FROM promotions WHERE seller_id = $1 ORDER BY usage_count DESC LIMIT 5`, [sellerId]
  );
  const t = total.rows[0];
  return {
    totalPromotions: parseInt(t.total),
    activeCount: parseInt(t.active),
    totalUsage: parseInt(t.usage),
    byType: byType.rows.map(r => ({ type: r.type, count: parseInt(r.count), usage: parseInt(r.usage) })),
    topPerforming: top.rows.map(r => ({ id: r.id, title: r.title, type: r.type, usageCount: parseInt(r.usageCount), usageLimit: r.usageLimit ? parseInt(r.usageLimit) : null })),
  };
}
