export type InventoryChangeType = "stock_added" | "stock_reduced" | "order_placed" | "order_cancelled" | "return_received" | "manual_adjustment" | "bulk_update";

export interface InventoryLogRecord {
  id: string;
  productId: string;
  variantId: string | null;
  changeType: InventoryChangeType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
}
