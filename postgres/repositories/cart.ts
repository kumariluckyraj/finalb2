import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CartItemRecord, CartItemWithProductRecord, CartRecord, CartWithItemsRecord } from "../models/Cart";
import type { ProductRecord } from "../models/Product";

const cartColumns = `
  id,
  scope_key AS "scopeKey",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const cartItemColumns = `
  ci.id,
  ci.cart_id AS "cartId",
  ci.product_id AS "productId",
  ci.quantity,
  ci.size,
  ci.created_at AS "createdAt",
  ci.updated_at AS "updatedAt"
`;

const productColumns = `
  p.id AS "product.id",
  p.vendor_id AS "product.vendorId",
  p.name AS "product.name",
  p.description AS "product.description",
  p.category AS "product.category",
  p.actual_price::float8 AS "product.actualPrice",
  p.price::float8 AS "product.price",
  p.discount::float8 AS "product.discount",
  p.image AS "product.image",
  p.stock AS "product.stock",
  p.max_coin_redemption_percent AS "product.maxCoinRedemptionPercent",
  p.weight AS "product.weight",
  p.dimensions AS "product.dimensions",
  p.size AS "product.size",
  p.brand AS "product.brand",
  p.author AS "product.author",
  p.material AS "product.material",
  p.flavor AS "product.flavor",
  p.created_at AS "product.createdAt",
  p.updated_at AS "product.updatedAt"
`;

function hydrateProduct(row: Record<string, unknown>): ProductRecord | null {
  const productId = row["product.id"] as string | undefined;
  if (!productId) return null;
  return {
    id: productId,
    vendorId: row["product.vendorId"] as string,
    name: row["product.name"] as string,
    description: row["product.description"] as string,
    category: row["product.category"] as string,
    actualPrice: Number(row["product.actualPrice"]),
    price: Number(row["product.price"]),
    discount: Number(row["product.discount"]),
    image: row["product.image"] as string,
    stock: row["product.stock"] === null || row["product.stock"] === undefined ? null : Number(row["product.stock"]),
    maxCoinRedemptionPercent: Number(row["product.maxCoinRedemptionPercent"]),
    weight: (row["product.weight"] as string | null) ?? null,
    dimensions: (row["product.dimensions"] as string | null) ?? null,
    size: (row["product.size"] as string | null) ?? null,
    brand: (row["product.brand"] as string | null) ?? null,
    author: (row["product.author"] as string | null) ?? null,
    material: (row["product.material"] as string | null) ?? null,
    flavor: (row["product.flavor"] as string | null) ?? null,
    createdAt: row["product.createdAt"] as Date,
    updatedAt: row["product.updatedAt"] as Date,
  };
}

async function getOrCreateCart(userId?: string | null): Promise<CartRecord> {
  const scopeKey = userId ? `user:${userId}` : 'default';
  
  await query(
    `INSERT INTO carts (scope_key) VALUES ($1) ON CONFLICT (scope_key) DO NOTHING`,
    [scopeKey]
  );
  
  const { rows } = await query<CartRecord>(
    `SELECT ${cartColumns} FROM carts WHERE scope_key = $1 LIMIT 1`,
    [scopeKey]
  );
  
  return rows[0];
}

export async function getCart(userId?: string | null): Promise<CartWithItemsRecord> {
  const cart = await getOrCreateCart(userId);
  const { rows } = await query<Record<string, unknown>>(
    `
      SELECT
        ${cartItemColumns},
        ${productColumns}
      FROM cart_items ci
      LEFT JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC
    `,
    [cart.id]
  );

  const items: CartItemWithProductRecord[] = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    cartId: row.cartId as string,
    productId: hydrateProduct(row),
    quantity: Number(row.quantity),
    size: row.size as string,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  }));

  return { ...cart, items };
}

export async function listCartItems(userId?: string | null): Promise<CartItemWithProductRecord[]> {
  return (await getCart(userId)).items;
}

export async function addCartItem(productId: string, quantity = 1, size = "", userId?: string | null): Promise<CartItemRecord[]> {
  const cart = await getOrCreateCart(userId);
  const { rows } = await query<CartItemRecord>(
    `
      INSERT INTO cart_items (id, cart_id, product_id, quantity, size)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cart_id, product_id, size)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()
      RETURNING id, cart_id AS "cartId", product_id AS "productId", quantity, size, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [randomUUID(), cart.id, productId, quantity, size]
  );
  return rows;
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItemRecord | null> {
  const { rows } = await query<CartItemRecord>(
    `
      UPDATE cart_items
      SET quantity = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, cart_id AS "cartId", product_id AS "productId", quantity, size, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [itemId, quantity]
  );
  return rows[0] ?? null;
}

export async function removeCartItem(itemId: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
  return (rowCount ?? 0) > 0;
}

export async function clearCart(userId?: string | null): Promise<number> {
  const cart = await getOrCreateCart(userId);
  const { rowCount } = await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
  return rowCount ?? 0;
}
