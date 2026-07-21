import type { TimestampedRecord } from "./common";
import type { ProductRecord } from "./Product";

export interface CartRecord extends TimestampedRecord {
  id: string;
  scopeKey: string;
}

export interface CartItemRecord extends TimestampedRecord {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  size: string;
}

export type CartItemWithProductRecord = Omit<CartItemRecord, "productId"> & {
  productId: ProductRecord | null;
};

export interface CartWithItemsRecord extends CartRecord {
  items: CartItemWithProductRecord[];
}
