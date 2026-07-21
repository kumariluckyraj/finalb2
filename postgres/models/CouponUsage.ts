import type { TimestampedRecord } from "./common";

export interface CouponUsageRecord extends TimestampedRecord {
  id: string;
  couponId: string;
  userId: string;
  orderId: string | null;
  usedCount: number;
  lastUsedAt: Date;
}
