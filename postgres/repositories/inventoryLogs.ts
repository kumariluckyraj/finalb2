import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { InventoryChangeType, InventoryLogRecord } from "../models/InventoryLog";

export async function createInventoryLog(input: {
  productId: string; variantId?: string; changeType: InventoryChangeType;
  quantityChange: number; stockBefore: number; stockAfter: number;
  reason?: string; referenceType?: string; referenceId?: string;
}): Promise<InventoryLogRecord> {
  const { rows } = await query<InventoryLogRecord>(
    `
      INSERT INTO inventory_logs (id, product_id, variant_id, change_type, quantity_change, stock_before, stock_after, reason, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, product_id AS "productId", variant_id AS "variantId", change_type AS "changeType", quantity_change AS "quantityChange", stock_before AS "stockBefore", stock_after AS "stockAfter", reason, reference_type AS "referenceType", reference_id AS "referenceId", created_at AS "createdAt"
    `,
    [
      randomUUID(), input.productId, input.variantId ?? null, input.changeType,
      input.quantityChange, input.stockBefore, input.stockAfter,
      input.reason ?? null, input.referenceType ?? null, input.referenceId ?? null,
    ]
  );
  return rows[0];
}

export async function listInventoryLogs(productId: string): Promise<InventoryLogRecord[]> {
  const { rows } = await query<InventoryLogRecord>(
    `SELECT id, product_id AS "productId", variant_id AS "variantId", change_type AS "changeType", quantity_change AS "quantityChange", stock_before AS "stockBefore", stock_after AS "stockAfter", reason, reference_type AS "referenceType", reference_id AS "referenceId", created_at AS "createdAt" FROM inventory_logs WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId]
  );
  return rows;
}
