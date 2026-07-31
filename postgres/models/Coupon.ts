import type { TimestampedRecord } from "./common";

export type CouponScope = "seller" |"vendor" | "platform";
export type DiscountType = "percentage" | "fixed";

export interface CouponRecord extends TimestampedRecord {
  id: string;
  scope: CouponScope;
  creatorId: string;
  code: string;
  title: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minCartValue: number | null;
  maxDiscount: number | null;
  isReimbursed: boolean;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
   productId: string | null;      // NEW
  bankCodes: string[] | null; 
}

export interface CreateCouponInput {
  scope: CouponScope;
  creatorId: string;
  code: string;
  title: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minCartValue?: number;
  maxDiscount?: number;
  isReimbursed?: boolean;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt: Date;
  endsAt: Date;
   productId?: string | null;     // NEW
  bankCodes?: string[] | null; 
}
