import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { PartnerOfferRecord, CreatePartnerOfferInput, PartnerOfferRedemptionRecord } from "../models/PartnerOffer";

const offerSelect = `
  SELECT
    id, brand, category, description,
    coins_required AS "coinsRequired",
    discount_value AS "discountValue",
    icon_url AS "iconUrl",
    tag, terms_url AS "termsUrl",
    usage_limit AS "usageLimit",
    usage_count AS "usageCount",
    per_user_limit AS "perUserLimit",
    sort_order AS "sortOrder",
    is_active AS "isActive",
    starts_at AS "startsAt",
    ends_at AS "endsAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM partner_offers
`;

export async function createPartnerOffer(input: CreatePartnerOfferInput): Promise<PartnerOfferRecord> {
  const { rows } = await query<PartnerOfferRecord>(
    `INSERT INTO partner_offers (id, brand, category, description, coins_required, discount_value, icon_url, tag, terms_url, usage_limit, per_user_limit, sort_order, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id, brand, category, description, coins_required AS "coinsRequired", discount_value AS "discountValue", icon_url AS "iconUrl", tag, terms_url AS "termsUrl", usage_limit AS "usageLimit", usage_count AS "usageCount", per_user_limit AS "perUserLimit", sort_order AS "sortOrder", is_active AS "isActive", starts_at AS "startsAt", ends_at AS "endsAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [randomUUID(), input.brand, input.category, input.description, input.coinsRequired, input.discountValue, input.iconUrl ?? null, input.tag ?? null, input.termsUrl ?? null, input.usageLimit ?? null, input.perUserLimit ?? 1, input.sortOrder ?? 0, input.startsAt, input.endsAt]
  );
  return rows[0];
}

export async function findPartnerOfferById(id: string): Promise<PartnerOfferRecord | null> {
  const { rows } = await query<PartnerOfferRecord>(`${offerSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listActivePartnerOffers(): Promise<PartnerOfferRecord[]> {
  const { rows } = await query<PartnerOfferRecord>(
    `${offerSelect} WHERE is_active = true AND starts_at <= now() AND ends_at >= now() AND (usage_limit IS NULL OR usage_count < usage_limit) ORDER BY sort_order ASC, created_at DESC`
  );
  return rows;
}

export async function listAllPartnerOffers(): Promise<PartnerOfferRecord[]> {
  const { rows } = await query<PartnerOfferRecord>(`${offerSelect} ORDER BY sort_order ASC, created_at DESC`);
  return rows;
}

export async function updatePartnerOffer(id: string, patch: Partial<CreatePartnerOfferInput & { isActive: boolean }>): Promise<PartnerOfferRecord | null> {
  const existing = await findPartnerOfferById(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  const { rows } = await query<PartnerOfferRecord>(
    `UPDATE partner_offers SET brand = $2, category = $3, description = $4, coins_required = $5, discount_value = $6, icon_url = $7, tag = $8, terms_url = $9, usage_limit = $10, per_user_limit = $11, sort_order = $12, is_active = $13, starts_at = $14, ends_at = $15, updated_at = now()
     WHERE id = $1
     RETURNING id, brand, category, description, coins_required AS "coinsRequired", discount_value AS "discountValue", icon_url AS "iconUrl", tag, terms_url AS "termsUrl", usage_limit AS "usageLimit", usage_count AS "usageCount", per_user_limit AS "perUserLimit", sort_order AS "sortOrder", is_active AS "isActive", starts_at AS "startsAt", ends_at AS "endsAt", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, next.brand, next.category, next.description, next.coinsRequired, next.discountValue, next.iconUrl ?? null, next.tag ?? null, next.termsUrl ?? null, next.usageLimit ?? null, next.perUserLimit ?? 1, next.sortOrder ?? 0, next.isActive, next.startsAt, next.endsAt]
  );
  return rows[0] ?? null;
}

export async function deletePartnerOffer(id: string): Promise<boolean> {
  const { rowCount } = await query(`UPDATE partner_offers SET is_active = false, updated_at = now() WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function incrementOfferUsage(id: string): Promise<void> {
  await query(`UPDATE partner_offers SET usage_count = usage_count + 1, updated_at = now() WHERE id = $1`, [id]);
}

// Redemption functions

const redemptionSelect = `
  SELECT
    id, offer_id AS "offerId", user_id AS "userId",
    coupon_code AS "couponCode", coins_spent AS "coinsSpent",
    status, used_at AS "usedAt", created_at AS "createdAt"
  FROM partner_offer_redemptions
`;

export async function createRedemption(offerId: string, userId: string, couponCode: string, coinsSpent: number): Promise<PartnerOfferRedemptionRecord> {
  const { rows } = await query<PartnerOfferRedemptionRecord>(
    `INSERT INTO partner_offer_redemptions (id, offer_id, user_id, coupon_code, coins_spent, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING id, offer_id AS "offerId", user_id AS "userId", coupon_code AS "couponCode", coins_spent AS "coinsSpent", status, used_at AS "usedAt", created_at AS "createdAt"`,
    [randomUUID(), offerId, userId, couponCode, coinsSpent]
  );
  return rows[0];
}

export async function getUserRedemptions(userId: string): Promise<(PartnerOfferRedemptionRecord & { brand: string; category: string; description: string })[]> {
  const { rows } = await query<any>(
    `SELECT r.id, r.offer_id AS "offerId", r.user_id AS "userId", r.coupon_code AS "couponCode", r.coins_spent AS "coinsSpent", r.status, r.used_at AS "usedAt", r.created_at AS "createdAt",
            o.brand, o.category, o.description
     FROM partner_offer_redemptions r
     JOIN partner_offers o ON o.id = r.offer_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getUserRedemptionCountForOffer(offerId: string, userId: string): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM partner_offer_redemptions WHERE offer_id = $1 AND user_id = $2`,
    [offerId, userId]
  );
  return rows[0]?.count ?? 0;
}
