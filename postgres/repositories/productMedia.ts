import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { ProductMediaRecord } from "../models/ProductMedia";

export async function addProductMedia(input: { productId: string; url: string; type?: "image" | "video"; isPrimary?: boolean; sortOrder?: number }): Promise<ProductMediaRecord> {
  const { rows } = await query<ProductMediaRecord>(
    `
      INSERT INTO product_media (id, product_id, url, type, is_primary, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, product_id AS "productId", url, type, is_primary AS "isPrimary", sort_order AS "sortOrder", created_at AS "createdAt"
    `,
    [randomUUID(), input.productId, input.url, input.type ?? "image", input.isPrimary ?? false, input.sortOrder ?? 0]
  );
  return rows[0];
}

export async function listMediaByProduct(productId: string): Promise<ProductMediaRecord[]> {
  const { rows } = await query<ProductMediaRecord>(
    `SELECT id, product_id AS "productId", url, type, is_primary AS "isPrimary", sort_order AS "sortOrder", created_at AS "createdAt" FROM product_media WHERE product_id = $1 ORDER BY sort_order ASC`,
    [productId]
  );
  return rows;
}

export async function deleteProductMedia(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM product_media WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function setPrimaryMedia(productId: string, mediaId: string): Promise<void> {
  await query(`UPDATE product_media SET is_primary = false WHERE product_id = $1`, [productId]);
  await query(`UPDATE product_media SET is_primary = true WHERE id = $1`, [mediaId]);
}
