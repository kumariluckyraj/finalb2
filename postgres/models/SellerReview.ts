import type { TimestampedRecord } from "./common";

export interface SellerReviewRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  storeId: string | null;
  userId: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  sellerReply: string | null;
  sellerRepliedAt: Date | null;
  isFlagged: boolean;
  flagReason: string | null;
}
