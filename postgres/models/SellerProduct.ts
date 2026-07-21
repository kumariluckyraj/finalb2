import type { TimestampedRecord } from "./common";

export type ProductStatus = "draft" | "active" | "archived" | "unlisted";
export type FulfillmentMethod = "self" | "b2world";

export interface SellerProductRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  storeId: string | null;
  name: string;
  description: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  mrp: number;
  sellingPrice: number;
  discount: number;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockThreshold: number;
  weight: number | null;
  weightUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  dimensionUnit: string;
  shipsFrom: string | null;
  handlingTime: number;
  fulfillmentMethod: FulfillmentMethod;
  searchTitle: string | null;
  tags: string[];
  keywords: string[];
  status: ProductStatus;
  isFeatured: boolean;
  isPromoted: boolean;
    warehouseAddress: string | null;
  warehouseCity: string | null;
  warehouseState: string | null;
  warehousePincode: string | null;
}

export interface CreateSellerProductInput {
  sellerId: string;
  storeId?: string | null;
  name: string;
  description: string;
  brand?: string | null;
  category: string;
  subcategory?: string | null;
  mrp: number;
  sellingPrice: number;
  discount?: number;
  sku?: string | null;
  barcode?: string | null;
  stock?: number;
  lowStockThreshold?: number;
  weight?: number | null;
  weightUnit?: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string;
  shipsFrom?: string | null;
  handlingTime?: number;
  fulfillmentMethod?: FulfillmentMethod;
  searchTitle?: string | null;
  tags?: string[];
  keywords?: string[];
  status?: ProductStatus;
   warehouseAddress?: string | null;
  warehouseCity?: string | null;
  warehouseState?: string | null;
  warehousePincode?: string | null;
}
