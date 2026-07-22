import type { TimestampedRecord } from "./common";

export type ReturnStatus =
  | "pending"              // Return Requested
  | "under_review"         // Return Request Under Review
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "pickup_completed"
  | "in_transit"
  | "received"             // Item Received by Vendor
  | "inspection"           // Quality Inspection
  | "inspection_passed"    // Return Accepted
  | "inspection_failed"    // Return Rejected (post-inspection)
  | "resolution_initiated" // Refund Initiated / Replacement Approved
  | "resolved";            // Refund Completed / Replacement Delivered

export type ResolutionType = "refund" | "replacement";
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
  resolutionType: ResolutionType | null;
  refundStatus: RefundStatus;
  refundAmount: number | null;
  pickupAddress: string | null;
  pickupScheduledAt: Date | null;
  pickupNotes: string | null;
  pickupCompletedAt: Date | null;
  inTransitAt: Date | null;
  returnTrackingNumber: string | null;
  returnCourier: string | null;
  receivedAt: Date | null;
  inspectionAt: Date | null;
  inspectionNotes: string | null;
  inspectionResult: "passed" | "failed" | null;
  resolvedAt: Date | null;
  adminNote: string | null;
  timeline: any[];
}