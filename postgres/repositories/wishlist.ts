import { query } from "../lib/db";
import type { WishlistRecord } from "../models/Wishlist";

export async function getUserWishlist(userId: string): Promise<string[]> {
  const { rows } = await query<{ productId: string }>(
    `SELECT product_id AS "productId" FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(r => r.productId);
}

export async function getWishlistCount(userId: string): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM wishlists WHERE user_id = $1`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function isProductWishlisted(userId: string, productId: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  await query(
    `INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
}

export async function removeFromWishlist(userId: string, productId: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return (rowCount ?? 0) > 0;
}
