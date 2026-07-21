import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateProductInput, ProductRecord } from "../models/Product";
import type { ProductSearchOptions } from "@/lib/productSearch";
import { buildProductQuery } from "@/lib/productSearch";

const productSelect = `
  SELECT
    id,
    vendor_id AS "vendorId",
    name,
    description,
    category,
    actual_price::float8 AS "actualPrice",
    price::float8 AS "price",
    discount::float8 AS "discount",
    image,
    stock,
    max_coin_redemption_percent AS "maxCoinRedemptionPercent",
    weight,
    dimensions,
    size,
    brand,
    author,
    material,
    flavor,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM products
`;

export async function createProduct(input: CreateProductInput): Promise<ProductRecord> {
  const id = input.id ?? randomUUID();
  const { rows } = await query<ProductRecord>(
    `
      INSERT INTO products (
        id, vendor_id, name, description, category, actual_price, price, discount,
        image, stock, max_coin_redemption_percent, weight, dimensions, size, brand, author, material, flavor
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, vendor_id AS "vendorId", name, description, category, actual_price::float8 AS "actualPrice", price::float8 AS "price", discount::float8 AS "discount", image, stock, max_coin_redemption_percent AS "maxCoinRedemptionPercent", weight, dimensions, size, brand, author, material, flavor, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      input.vendorId,
      input.name,
      input.description,
      input.category,
      input.actualPrice,
      input.price,
      input.discount,
      input.image,
      input.stock ?? null,
      input.maxCoinRedemptionPercent ?? 10,
      input.weight ?? null,
      input.dimensions ?? null,
      input.size ?? null,
      input.brand ?? null,
      input.author ?? null,
      input.material ?? null,
      input.flavor ?? null,
    ]
  );
  return rows[0];
}

export async function findProductById(id: string): Promise<ProductRecord | null> {
  const { rows } = await query<ProductRecord>(`${productSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function searchProducts(options: ProductSearchOptions): Promise<ProductRecord[]> {
  const { whereSql, params, orderBySql, limit } = buildProductQuery(options);
  const { rows } = await query<ProductRecord>(`${productSelect} ${whereSql} ${orderBySql} LIMIT $${params.length + 1}`, [...params, limit]);
  return rows;
}

export async function listProducts(): Promise<ProductRecord[]> {
  const { rows } = await query<ProductRecord>(`${productSelect} ORDER BY created_at DESC`);
  return rows;
}

export async function listProductsByCategory(category: string): Promise<ProductRecord[]> {
  const { rows } = await query<ProductRecord>(`${productSelect} WHERE category = $1 ORDER BY created_at DESC`, [category]);
  return rows;
}

export async function listProductsByVendor(vendorId: string): Promise<ProductRecord[]> {
  const { rows } = await query<ProductRecord>(`${productSelect} WHERE vendor_id = $1 ORDER BY created_at DESC`, [vendorId]);
  return rows;
}

export async function updateProduct(id: string, patch: Partial<CreateProductInput>): Promise<ProductRecord | null> {
  const existing = await findProductById(id);
  if (!existing) return null;

  const next = {
    ...existing,
    ...patch,
    vendorId: patch.vendorId ?? existing.vendorId,
    maxCoinRedemptionPercent: patch.maxCoinRedemptionPercent ?? existing.maxCoinRedemptionPercent,
  };

  const { rows } = await query<ProductRecord>(
    `
      UPDATE products
      SET
        vendor_id = $2,
        name = $3,
        description = $4,
        category = $5,
        actual_price = $6,
        price = $7,
        discount = $8,
        image = $9,
        stock = $10,
        max_coin_redemption_percent = $11,
        weight = $12,
        dimensions = $13,
        size = $14,
        brand = $15,
        author = $16,
        material = $17,
        flavor = $18,
        updated_at = now()
      WHERE id = $1
      RETURNING id, vendor_id AS "vendorId", name, description, category, actual_price::float8 AS "actualPrice", price::float8 AS "price", discount::float8 AS "discount", image, stock, max_coin_redemption_percent AS "maxCoinRedemptionPercent", weight, dimensions, size, brand, author, material, flavor, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      next.vendorId,
      next.name,
      next.description,
      next.category,
      next.actualPrice,
      next.price,
      next.discount,
      next.image,
      next.stock ?? null,
      next.maxCoinRedemptionPercent,
      next.weight ?? null,
      next.dimensions ?? null,
      next.size ?? null,
      next.brand ?? null,
      next.author ?? null,
      next.material ?? null,
      next.flavor ?? null,
    ]
  );
  return rows[0] ?? null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM products WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function syncFromSellerProduct(sp: {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  mrp: number;
  sellingPrice: number;
  discount: number;
  image: string;
  stock: number;
  brand: string | null;
  status: string;
}): Promise<void> {
  if (sp.status !== "active") {
    await query(`DELETE FROM products WHERE id = $1`, [sp.id]);
    return;
  }
  await query(
    `
      INSERT INTO products (id, vendor_id, name, description, category, actual_price, price, discount, image, stock, brand)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        vendor_id = EXCLUDED.vendor_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        actual_price = EXCLUDED.actual_price,
        price = EXCLUDED.price,
        discount = EXCLUDED.discount,
        image = EXCLUDED.image,
        stock = EXCLUDED.stock,
        brand = EXCLUDED.brand,
        updated_at = now()
    `,
    [sp.id, sp.vendorId, sp.name, sp.description, sp.category, sp.mrp, sp.sellingPrice, sp.discount, sp.image, sp.stock, sp.brand]
  );
}

export async function updateCategoryCoinRedemptionPercent(category: string, percent: number): Promise<number> {
  const { rowCount } = await query(
    `UPDATE products SET max_coin_redemption_percent = $1, updated_at = now() WHERE category = $2`,
    [percent, category]
  );
  return rowCount ?? 0;
}

export async function updateProductCoinRedemptionPercent(id: string, percent: number): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE products SET max_coin_redemption_percent = $1, updated_at = now() WHERE id = $2`,
    [percent, id]
  );
  return (rowCount ?? 0) > 0;
}
