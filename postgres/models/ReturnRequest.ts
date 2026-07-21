import type { TimestampedRecord } from "./common";

export type ReturnStatus = "pending" | "approved" | "rejected" | "picked_up" | "refunded";
export type RefundStatus = "pending" | "processing" | "completed" | "failed";

export interface ReturnRequestRecord extends TimestampedRecord {
  id: string;
  sellerOrderId: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  reason: string;
  description: string | null;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundAmount: number | null;
  pickupAddress: string | null;
  pickupScheduledAt: Date | null;
  pickupNotes: string | null;
  adminNote: string | null;
  timeline: any[];
}
