import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateStoreInput, StoreRecord } from "../models/Store";

const storeSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    store_name AS "storeName",
    url_slug AS "urlSlug",
    banner_url AS "bannerUrl",
    description,
    shipping_policy AS "shippingPolicy",
    return_policy AS "returnPolicy",
    primary_category AS "primaryCategory",
    subcategories,
    rating,
    total_ratings AS "totalRatings",
    is_featured AS "isFeatured",
    is_published AS "isPublished",
    cod_enabled AS "codEnabled",
    delivery_promise_days AS "deliveryPromiseDays",
    delivery_charge AS "deliveryCharge",
    free_shipping_threshold AS "freeShippingThreshold",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM stores
`;

export async function createStore(input: CreateStoreInput): Promise<StoreRecord> {
  const { rows } = await query<StoreRecord>(
    `
      INSERT INTO stores (id, seller_id, store_name, url_slug, banner_url, description, shipping_policy, return_policy, primary_category, subcategories, cod_enabled, delivery_promise_days, delivery_charge, free_shipping_threshold)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, seller_id AS "sellerId", store_name AS "storeName", url_slug AS "urlSlug", banner_url AS "bannerUrl", description, shipping_policy AS "shippingPolicy", return_policy AS "returnPolicy", primary_category AS "primaryCategory", subcategories, rating, total_ratings AS "totalRatings", is_featured AS "isFeatured", is_published AS "isPublished", cod_enabled AS "codEnabled", delivery_promise_days AS "deliveryPromiseDays", delivery_charge AS "deliveryCharge", free_shipping_threshold AS "freeShippingThreshold", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.sellerId,
      input.storeName,
      input.urlSlug,
      input.bannerUrl ?? null,
      input.description ?? null,
      input.shippingPolicy ?? null,
      input.returnPolicy ?? null,
      input.primaryCategory ?? null,
      JSON.stringify(input.subcategories ?? []),
      input.codEnabled ?? true,
      input.deliveryPromiseDays ?? 5,
      input.deliveryCharge ?? 40,
      input.freeShippingThreshold ?? null,
    ]
  );
  return rows[0];
}

export async function findStoreBySellerId(sellerId: string): Promise<StoreRecord | null> {
  const { rows } = await query<StoreRecord>(`${storeSelect} WHERE seller_id = $1`, [sellerId]);
  return rows[0] ?? null;
}

export async function findStoreBySlug(slug: string): Promise<StoreRecord | null> {
  const { rows } = await query<StoreRecord>(`${storeSelect} WHERE url_slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function updateStore(sellerId: string, patch: Partial<CreateStoreInput & { rating: number; totalRatings: number; isFeatured: boolean; isPublished: boolean }>): Promise<StoreRecord | null> {
  const existing = await findStoreBySellerId(sellerId);
  if (!existing) return null;

  const next = { ...existing, ...patch };
  const { rows } = await query<StoreRecord>(
    `
      UPDATE stores
      SET
        store_name = $2,
        url_slug = $3,
        banner_url = $4,
        description = $5,
        shipping_policy = $6,
        return_policy = $7,
        primary_category = $8,
        subcategories = $9,
        rating = $10,
        total_ratings = $11,
        is_featured = $12,
        is_published = $13,
        cod_enabled = $14,
        delivery_promise_days = $15,
        delivery_charge = $16,
        free_shipping_threshold = $17,
        updated_at = now()
      WHERE seller_id = $1
      RETURNING id, seller_id AS "sellerId", store_name AS "storeName", url_slug AS "urlSlug", banner_url AS "bannerUrl", description, shipping_policy AS "shippingPolicy", return_policy AS "returnPolicy", primary_category AS "primaryCategory", subcategories, rating, total_ratings AS "totalRatings", is_featured AS "isFeatured", is_published AS "isPublished", cod_enabled AS "codEnabled", delivery_promise_days AS "deliveryPromiseDays", delivery_charge AS "deliveryCharge", free_shipping_threshold AS "freeShippingThreshold", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
  [
      sellerId,
      next.storeName,
      next.urlSlug,
      next.bannerUrl ?? null,
      next.description ?? null,
      next.shippingPolicy ?? null,
      next.returnPolicy ?? null,
      next.primaryCategory ?? null,
      JSON.stringify(next.subcategories ?? []),
      next.rating,
      next.totalRatings,
      next.isFeatured,
      next.isPublished,
      next.codEnabled ?? existing.codEnabled,
      next.deliveryPromiseDays ?? existing.deliveryPromiseDays,
      next.deliveryCharge ?? existing.deliveryCharge,
      next.freeShippingThreshold ?? existing.freeShippingThreshold,
    ]
  );
  return rows[0] ?? null;
}
