import type { TimestampedRecord } from "./common";

export interface StoreRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  storeName: string;
  urlSlug: string;
  bannerUrl: string | null;
  description: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  primaryCategory: string | null;
  subcategories: string[];
  rating: number;
  totalRatings: number;
  isFeatured: boolean;
  isPublished: boolean;
  codEnabled: boolean;
  deliveryPromiseDays: number;
  deliveryCharge: number;
  freeShippingThreshold: number | null;
}

export interface CreateStoreInput {
  sellerId: string;
  storeName: string;
  urlSlug: string;
  bannerUrl?: string | null;
  description?: string | null;
  shippingPolicy?: string | null;
  returnPolicy?: string | null;
  primaryCategory?: string | null;
  subcategories?: string[];
  codEnabled?: boolean;
  deliveryPromiseDays?: number;
  deliveryCharge?: number;
  freeShippingThreshold?: number | null;
}
