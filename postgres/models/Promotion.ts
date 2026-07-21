import type { TimestampedRecord } from "./common";

export type PromotionType = "discount_code" | "bundle_offer" | "platform_sale" | "featured_listing" | "promoted_product";

export interface PromotionRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  storeId: string | null;
  type: PromotionType;
  title: string;
  description: string | null;
  code: string | null;
  discountType: "percentage" | "fixed" | null;
  discountValue: number | null;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  bundleProductIds: string[];
  bundlePrice: number | null;
  applicableCategories: string[];
  applicableProducts: string[];
  perUserLimit: number | null;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface PromotionUsageRecord {
  id: string;
  promotionId: string;
  userId: string;
  orderId: string | null;
  usedCount: number;
  lastUsedAt: Date;
}
