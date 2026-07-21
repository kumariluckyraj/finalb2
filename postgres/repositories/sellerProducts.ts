import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateSellerProductInput, SellerProductRecord } from "../models/SellerProduct";

const productSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    store_id AS "storeId",
    name,
    description,
    brand,
    category,
    subcategory,
    mrp,
    selling_price AS "sellingPrice",
    discount,
    sku,
    barcode,
    stock,
    low_stock_threshold AS "lowStockThreshold",
    weight,
    weight_unit AS "weightUnit",
    length,
    width,
    height,
    dimension_unit AS "dimensionUnit",
    ships_from AS "shipsFrom",
     warehouse_address AS "warehouseAddress",
    warehouse_city AS "warehouseCity",
    warehouse_state AS "warehouseState",
    warehouse_pincode AS "warehousePincode",
    handling_time AS "handlingTime",
    handling_time AS "handlingTime",
    fulfillment_method AS "fulfillmentMethod",
    search_title AS "searchTitle",
    tags,
    keywords,
    status,
    is_featured AS "isFeatured",
    is_promoted AS "isPromoted",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM seller_products
`;

export async function createSellerProduct(input: CreateSellerProductInput): Promise<SellerProductRecord> {
  const { rows } = await query<SellerProductRecord>(
    `
      INSERT INTO seller_products (
        id, seller_id, store_id, name, description, brand, category, subcategory,
        mrp, selling_price, discount, sku, barcode, stock, low_stock_threshold,
        weight, weight_unit, length, width, height, dimension_unit,
        ships_from, warehouse_address, warehouse_city, warehouse_state, warehouse_pincode,
        handling_time, fulfillment_method, search_title, tags, keywords, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
      RETURNING id, seller_id AS "sellerId", store_id AS "storeId", name, description, brand, category, subcategory, mrp, selling_price AS "sellingPrice", discount, sku, barcode, stock, low_stock_threshold AS "lowStockThreshold", weight, weight_unit AS "weightUnit", length, width, height, dimension_unit AS "dimensionUnit", ships_from AS "shipsFrom", warehouse_address AS "warehouseAddress", warehouse_city AS "warehouseCity", warehouse_state AS "warehouseState", warehouse_pincode AS "warehousePincode", handling_time AS "handlingTime", fulfillment_method AS "fulfillmentMethod", search_title AS "searchTitle", tags, keywords, status, is_featured AS "isFeatured", is_promoted AS "isPromoted", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.sellerId,
      input.storeId ?? null,
      input.name,
      input.description,
      input.brand ?? null,
      input.category,
      input.subcategory ?? null,
      input.mrp,
      input.sellingPrice,
      input.discount ?? 0,
      input.sku ?? null,
      input.barcode ?? null,
      input.stock ?? 0,
      input.lowStockThreshold ?? 5,
      input.weight ?? null,
      input.weightUnit ?? "kg",
      input.length ?? null,
      input.width ?? null,
      input.height ?? null,
      input.dimensionUnit ?? "cm",
      input.shipsFrom ?? null,
      input.warehouseAddress ?? null,
      input.warehouseCity ?? null,
      input.warehouseState ?? null,
      input.warehousePincode ?? null,
      input.handlingTime ?? 1,
      input.fulfillmentMethod ?? "self",
      input.searchTitle ?? null,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.keywords ?? []),
      input.status ?? "draft",
    ]
  );
  return rows[0];
}

export async function findSellerProductById(id: string): Promise<SellerProductRecord | null> {
  const { rows } = await query<SellerProductRecord>(`${productSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listSellerProducts(sellerId: string, options?: { status?: string; category?: string; search?: string; lowStock?: boolean; limit?: number; offset?: number }): Promise<SellerProductRecord[]> {
  const conditions: string[] = ["seller_id = $1"];
  const params: unknown[] = [sellerId];
  let paramIndex = 2;

  if (options?.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(options.status);
    paramIndex++;
  }
  if (options?.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(options.category);
    paramIndex++;
  }
  if (options?.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR search_title ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`);
    params.push(`%${options.search}%`);
    paramIndex++;
  }
  if (options?.lowStock) {
    conditions.push(`stock <= low_stock_threshold AND stock > 0`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const { rows } = await query<SellerProductRecord>(
    `${productSelect} ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

export async function updateSellerProduct(id: string, patch: Partial<CreateSellerProductInput & { status: string; isFeatured: boolean; isPromoted: boolean }>): Promise<SellerProductRecord | null> {
  const existing = await findSellerProductById(id);
  if (!existing) return null;

  const next = { ...existing, ...patch };
  const { rows } = await query<SellerProductRecord>(
    `
      UPDATE seller_products
      SET
        store_id = $2, name = $3, description = $4, brand = $5, category = $6, subcategory = $7,
        mrp = $8, selling_price = $9, discount = $10, sku = $11, barcode = $12,
        stock = $13, low_stock_threshold = $14, weight = $15, weight_unit = $16,
        length = $17, width = $18, height = $19, dimension_unit = $20,
        ships_from = $21, warehouse_address = $22, warehouse_city = $23,
        warehouse_state = $24, warehouse_pincode = $25,
        handling_time = $26, fulfillment_method = $27,
        search_title = $28, tags = $29, keywords = $30, status = $31,
        is_featured = $32, is_promoted = $33, updated_at = now()
      WHERE id = $1
      RETURNING id, seller_id AS "sellerId", store_id AS "storeId", name, description, brand, category, subcategory, mrp, selling_price AS "sellingPrice", discount, sku, barcode, stock, low_stock_threshold AS "lowStockThreshold", weight, weight_unit AS "weightUnit", length, width, height, dimension_unit AS "dimensionUnit", ships_from AS "shipsFrom", warehouse_address AS "warehouseAddress", warehouse_city AS "warehouseCity", warehouse_state AS "warehouseState", warehouse_pincode AS "warehousePincode", handling_time AS "handlingTime", fulfillment_method AS "fulfillmentMethod", search_title AS "searchTitle", tags, keywords, status, is_featured AS "isFeatured", is_promoted AS "isPromoted", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      next.storeId ?? null, next.name, next.description, next.brand ?? null,
      next.category, next.subcategory ?? null, next.mrp, next.sellingPrice,
      next.discount, next.sku ?? null, next.barcode ?? null, next.stock,
      next.lowStockThreshold, next.weight ?? null, next.weightUnit,
      next.length ?? null, next.width ?? null, next.height ?? null, next.dimensionUnit,
      next.shipsFrom ?? null, next.warehouseAddress ?? null, next.warehouseCity ?? null,
      next.warehouseState ?? null, next.warehousePincode ?? null,
      next.handlingTime, next.fulfillmentMethod,
      next.searchTitle ?? null, JSON.stringify(next.tags), JSON.stringify(next.keywords),
      next.status, next.isFeatured, next.isPromoted,
    ]
  );
  return rows[0] ?? null;
}

export async function deleteSellerProduct(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM seller_products WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function bulkUpdateStock(updates: { id: string; stock: number }[]): Promise<boolean> {
  for (const u of updates) {
    await query(`UPDATE seller_products SET stock = $2, updated_at = now() WHERE id = $1`, [u.id, u.stock]);
  }
  return true;
}

export async function duplicateProduct(id: string): Promise<SellerProductRecord | null> {
  const original = await findSellerProductById(id);
  if (!original) return null;
  return createSellerProduct({
    ...original,
    name: `${original.name} (Copy)`,
    sku: original.sku ? `${original.sku}-copy` : null,
    status: "draft",
  });
}
