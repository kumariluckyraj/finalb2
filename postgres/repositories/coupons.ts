import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CouponRecord, CreateCouponInput } from "../models/Coupon";

const couponSelect = `
  SELECT
    id, scope, creator_id AS "creatorId", code, title, description,
    discount_type AS "discountType", discount_value AS "discountValue",
    min_cart_value AS "minCartValue", max_discount AS "maxDiscount",
    is_reimbursed AS "isReimbursed", usage_limit AS "usageLimit",
    usage_count AS "usageCount", per_user_limit AS "perUserLimit",
    starts_at AS "startsAt", ends_at AS "endsAt", is_active AS "isActive",
    product_id AS "productId", bank_codes AS "bankCodes",
    created_at AS "createdAt", updated_at AS "updatedAt"
  FROM coupons
`;

export async function createCoupon(input: CreateCouponInput): Promise<CouponRecord> {
  const { rows } = await query<CouponRecord>(
    `
      INSERT INTO coupons (
        id, scope, creator_id, code, title, description, discount_type, discount_value,
        min_cart_value, max_discount, is_reimbursed, usage_limit, per_user_limit,
        starts_at, ends_at, product_id, bank_codes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING id, scope, creator_id AS "creatorId", code, title, description,
        discount_type AS "discountType", discount_value AS "discountValue",
        min_cart_value AS "minCartValue", max_discount AS "maxDiscount",
        is_reimbursed AS "isReimbursed", usage_limit AS "usageLimit", usage_count AS "usageCount",
        per_user_limit AS "perUserLimit", starts_at AS "startsAt", ends_at AS "endsAt",
        is_active AS "isActive", product_id AS "productId", bank_codes AS "bankCodes",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(), input.scope, input.creatorId, input.code, input.title,
      input.description ?? null, input.discountType, input.discountValue,
      input.minCartValue ?? null, input.maxDiscount ?? null,
      input.isReimbursed ?? false, input.usageLimit ?? null,
      input.perUserLimit ?? 1, input.startsAt, input.endsAt,
      input.productId ?? null, input.bankCodes ?? null,
    ]
  );
  return rows[0];
}

export async function findCouponById(id: string): Promise<CouponRecord | null> {
  const { rows } = await query<CouponRecord>(`${couponSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findActiveCouponByCode(code: string): Promise<CouponRecord | null> {
  const { rows } = await query<CouponRecord>(
    `${couponSelect} WHERE code = $1 AND is_active = true AND starts_at <= now() AND ends_at >= now() AND (usage_limit IS NULL OR usage_count < usage_limit)`,
    [code]
  );
  return rows[0] ?? null;
}

export async function listCoupons(scope?: string, creatorId?: string): Promise<CouponRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (scope) { values.push(scope); conditions.push(`scope = $${values.length}`); }
  if (creatorId) { values.push(creatorId); conditions.push(`creator_id = $${values.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query<CouponRecord>(`${couponSelect} ${where} ORDER BY created_at DESC`, values);
  return rows;
}

export async function listActiveCouponsPublic(productId?: string): Promise<CouponRecord[]> {
  const { rows } = await query<CouponRecord>(
    `${couponSelect}
     WHERE is_active = true
       AND starts_at <= now()
       AND ends_at >= now()
       AND (usage_limit IS NULL OR usage_count < usage_limit)
       AND (product_id IS NULL OR product_id = $1)
     ORDER BY ends_at ASC`,
    [productId ?? null]
  );
  return rows;

}

export async function listCouponsByCreator(creatorId: string): Promise<CouponRecord[]> {
  const { rows } = await query<CouponRecord>(`${couponSelect} WHERE creator_id = $1 ORDER BY created_at DESC`, [creatorId]);
  return rows;
}

export async function updateCoupon(id: string, patch: Partial<CreateCouponInput & { isActive: boolean }>): Promise<CouponRecord | null> {
  const existing = await findCouponById(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  const { rows } = await query<CouponRecord>(
    `
      UPDATE coupons SET
        code = $2, title = $3, description = $4, discount_type = $5, discount_value = $6,
        min_cart_value = $7, max_discount = $8, is_reimbursed = $9, usage_limit = $10,
        per_user_limit = $11, starts_at = $12, ends_at = $13, is_active = $14,
        updated_at = now()
      WHERE id = $1
      RETURNING id, scope, creator_id AS "creatorId", code, title, description, discount_type AS "discountType", discount_value AS "discountValue", min_cart_value AS "minCartValue", max_discount AS "maxDiscount", is_reimbursed AS "isReimbursed", usage_limit AS "usageLimit", usage_count AS "usageCount", per_user_limit AS "perUserLimit", starts_at AS "startsAt", ends_at AS "endsAt", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, next.code, next.title, next.description ?? null, next.discountType, next.discountValue,
     next.minCartValue ?? null, next.maxDiscount ?? null, next.isReimbursed,
     next.usageLimit ?? null, next.perUserLimit ?? 1, next.startsAt, next.endsAt, next.isActive]
  );
  return rows[0] ?? null;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM coupons WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function incrementCouponUsage(id: string): Promise<void> {
  await query(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [id]);
}

export async function recordCouponUsage(couponId: string, userId: string, orderId: string): Promise<void> {
  await query(
    `INSERT INTO coupon_usage (id, coupon_id, user_id, order_id, used_count, last_used_at)
     VALUES ($1, $2, $3, $4, 1, now())
     ON CONFLICT (coupon_id, user_id) DO UPDATE SET
       used_count = coupon_usage.used_count + 1,
       order_id = $4,
       last_used_at = now()`,
    [randomUUID(), couponId, userId, orderId]
  );
}

export async function getUserCouponUsage(couponId: string, userId: string): Promise<number> {
  const { rows } = await query<{ usedCount: number }>(
    `SELECT used_count AS "usedCount" FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2`,
    [couponId, userId]
  );
  return rows[0]?.usedCount ?? 0;
}
