import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateProductVariantInput, ProductVariantRecord } from "../models/ProductVariant";

const variantSelect = `
  SELECT
    id,
    product_id AS "productId",
    name,
    sku,
    price,
    stock,
    image_url AS "imageUrl",
    attributes,
    sort_order AS "sortOrder",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM product_variants
`;

export async function createVariant(input: CreateProductVariantInput): Promise<ProductVariantRecord> {
  const { rows } = await query<ProductVariantRecord>(
    `
      INSERT INTO product_variants (id, product_id, name, sku, price, stock, image_url, attributes, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, product_id AS "productId", name, sku, price, stock, image_url AS "imageUrl", attributes, sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.productId,
      input.name,
      input.sku ?? null,
      input.price,
      input.stock ?? 0,
      input.imageUrl ?? null,
      JSON.stringify(input.attributes ?? {}),
      input.sortOrder ?? 0,
    ]
  );
  return rows[0];
}

export async function listVariantsByProduct(productId: string): Promise<ProductVariantRecord[]> {
  const { rows } = await query<ProductVariantRecord>(`${variantSelect} WHERE product_id = $1 ORDER BY sort_order ASC`, [productId]);
  return rows;
}

export async function updateVariant(id: string, patch: Partial<CreateProductVariantInput>): Promise<ProductVariantRecord | null> {
  const existing = (await query<ProductVariantRecord>(`${variantSelect} WHERE id = $1`, [id])).rows[0];
  if (!existing) return null;

  const next = { ...existing, ...patch };
  const { rows } = await query<ProductVariantRecord>(
    `
      UPDATE product_variants
      SET name = $2, sku = $3, price = $4, stock = $5, image_url = $6, attributes = $7, sort_order = $8, updated_at = now()
      WHERE id = $1
      RETURNING id, product_id AS "productId", name, sku, price, stock, image_url AS "imageUrl", attributes, sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, next.name, next.sku ?? null, next.price, next.stock, next.imageUrl ?? null, JSON.stringify(next.attributes), next.sortOrder]
  );
  return rows[0] ?? null;
}

export async function deleteVariant(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM product_variants WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function deleteVariantsByProduct(productId: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
  return (rowCount ?? 0) > 0;
}
