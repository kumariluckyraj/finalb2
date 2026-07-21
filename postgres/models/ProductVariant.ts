import type { TimestampedRecord } from "./common";

export interface ProductVariantRecord extends TimestampedRecord {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  attributes: Record<string, string>;
  sortOrder: number;
}

export interface CreateProductVariantInput {
  productId: string;
  name: string;
  sku?: string | null;
  price: number;
  stock?: number;
  imageUrl?: string | null;
  attributes?: Record<string, string>;
  sortOrder?: number;
}
