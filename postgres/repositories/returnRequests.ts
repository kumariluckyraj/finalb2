import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { ReturnRequestRecord, ResolutionType } from "../models/ReturnRequest";

const returnSelect = `
  SELECT
    id,
    seller_order_id AS "sellerOrderId",
    order_id AS "orderId",
    seller_id AS "sellerId",
    buyer_id AS "buyerId",
    reason,
    description,
    status,
    resolution_type AS "resolutionType",
    refund_status AS "refundStatus",
    refund_amount AS "refundAmount",
    pickup_address AS "pickupAddress",
    pickup_scheduled_at AS "pickupScheduledAt",
    pickup_notes AS "pickupNotes",
    pickup_completed_at AS "pickupCompletedAt",
    in_transit_at AS "inTransitAt",
    return_tracking_number AS "returnTrackingNumber",
    return_courier AS "returnCourier",
    received_at AS "receivedAt",
    inspection_at AS "inspectionAt",
    inspection_notes AS "inspectionNotes",
    inspection_result AS "inspectionResult",
    resolved_at AS "resolvedAt",
    admin_note AS "adminNote",
    timeline,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM return_requests
`;

const returnReturning = `
  RETURNING id, seller_order_id AS "sellerOrderId", order_id AS "orderId",
    seller_id AS "sellerId", buyer_id AS "buyerId", reason, description, status,
    resolution_type AS "resolutionType",
    refund_status AS "refundStatus", refund_amount AS "refundAmount",
    pickup_address AS "pickupAddress", pickup_scheduled_at AS "pickupScheduledAt",
    pickup_notes AS "pickupNotes", pickup_completed_at AS "pickupCompletedAt",
    in_transit_at AS "inTransitAt", return_tracking_number AS "returnTrackingNumber",
    return_courier AS "returnCourier", received_at AS "receivedAt",
    inspection_at AS "inspectionAt", inspection_notes AS "inspectionNotes",
    inspection_result AS "inspectionResult", resolved_at AS "resolvedAt",
    admin_note AS "adminNote", timeline,
    created_at AS "createdAt", updated_at AS "updatedAt"
`;

async function appendTimeline(id: string, entry: Record<string, any>, extraSql: string, extraParams: unknown[]) {
  const timelineEntry = JSON.stringify([{ timestamp: new Date().toISOString(), ...entry }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET timeline = COALESCE(timeline, '[]'::jsonb) || $1::jsonb, updated_at = now()${extraSql}
     WHERE id = $2${returnReturning}`,
    [timelineEntry, id, ...extraParams]
  );
  return rows[0] ?? null;
}

export async function createReturnRequest(input: {
  sellerOrderId: string; orderId: string; sellerId: string; buyerId: string;
  reason: string; description?: string; resolutionType: ResolutionType;
}): Promise<ReturnRequestRecord> {
  const timelineEntry = JSON.stringify([{
    status: "pending", timestamp: new Date().toISOString(),
    description: "Return request submitted by buyer",
  }]);
  const { rows } = await query<ReturnRequestRecord>(
    `INSERT INTO return_requests (id, seller_order_id, order_id, seller_id, buyer_id, reason, description, resolution_type, timeline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)${returnReturning}`,
    [randomUUID(), input.sellerOrderId, input.orderId, input.sellerId, input.buyerId, input.reason, input.description ?? null, input.resolutionType, timelineEntry]
  );
  return rows[0];
}

export async function listReturnRequestsBySeller(sellerId: string): Promise<ReturnRequestRecord[]> {
  const { rows } = await query<ReturnRequestRecord>(`${returnSelect} WHERE seller_id = $1 ORDER BY created_at DESC`, [sellerId]);
  return rows;
}

export async function listAllReturnRequests(): Promise<ReturnRequestRecord[]> {
  const { rows } = await query<ReturnRequestRecord>(`${returnSelect} ORDER BY created_at DESC`);
  return rows;
}

export async function findReturnRequestById(id: string): Promise<ReturnRequestRecord | null> {
  const { rows } = await query<ReturnRequestRecord>(`${returnSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function moveToUnderReview(id: string) {
  return query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'under_review',
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, JSON.stringify([{ status: "under_review", timestamp: new Date().toISOString(), description: "Return request is under review" }])]
  ).then(r => r.rows[0] ?? null);
}

export async function approveReturn(id: string) {
  return query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'approved',
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, JSON.stringify([{ status: "approved", timestamp: new Date().toISOString(), description: "Return approved by seller" }])]
  ).then(r => r.rows[0] ?? null);
}

export async function rejectReturn(id: string, reason?: string) {
  return query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'rejected',
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, JSON.stringify([{ status: "rejected", timestamp: new Date().toISOString(), description: reason || "Return rejected by seller" }])]
  ).then(r => r.rows[0] ?? null);
}

export async function schedulePickup(id: string, pickupAddress: string, pickupScheduledAt: Date, pickupNotes?: string) {
  const timelineEntry = JSON.stringify([{
    status: "pickup_scheduled", timestamp: new Date().toISOString(),
    description: `Pickup scheduled for ${pickupScheduledAt.toLocaleDateString("en-IN")}`,
    address: pickupAddress, notes: pickupNotes ?? null,
  }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET status = 'pickup_scheduled', pickup_address = $2, pickup_scheduled_at = $3,
         pickup_notes = $4, timeline = COALESCE(timeline, '[]'::jsonb) || $5::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, pickupAddress, pickupScheduledAt, pickupNotes ?? null, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function markPickupCompleted(id: string) {
  const timelineEntry = JSON.stringify([{ status: "pickup_completed", timestamp: new Date().toISOString(), description: "Courier collected the item from the buyer" }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'pickup_completed', pickup_completed_at = now(),
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function markInTransit(id: string, trackingNumber?: string, courier?: string) {
  const timelineEntry = JSON.stringify([{
    status: "in_transit", timestamp: new Date().toISOString(),
    description: courier ? `Item in transit via ${courier}` : "Item in transit back to vendor",
    trackingNumber: trackingNumber ?? null, courier: courier ?? null,
  }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'in_transit', in_transit_at = now(),
       return_tracking_number = COALESCE($2, return_tracking_number),
       return_courier = COALESCE($3, return_courier),
       timeline = COALESCE(timeline, '[]'::jsonb) || $4::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, trackingNumber ?? null, courier ?? null, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function markReceived(id: string) {
  const timelineEntry = JSON.stringify([{ status: "received", timestamp: new Date().toISOString(), description: "Item received by vendor" }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'received', received_at = now(),
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function startInspection(id: string) {
  const timelineEntry = JSON.stringify([{ status: "inspection", timestamp: new Date().toISOString(), description: "Quality inspection in progress" }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = 'inspection', inspection_at = now(),
       timeline = COALESCE(timeline, '[]'::jsonb) || $2::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function completeInspection(id: string, passed: boolean, notes?: string) {
  const status = passed ? "inspection_passed" : "inspection_failed";
  const timelineEntry = JSON.stringify([{
    status, timestamp: new Date().toISOString(),
    description: passed ? "Item passed quality inspection — return accepted" : (notes || "Item failed quality inspection — return rejected"),
  }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET status = $2, inspection_result = $3, inspection_notes = $4,
       timeline = COALESCE(timeline, '[]'::jsonb) || $5::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, status, passed ? "passed" : "failed", notes ?? null, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function initiateResolution(id: string, resolutionType: ResolutionType) {
  const description = resolutionType === "refund" ? "Refund initiated" : "Replacement approved";
  const timelineEntry = JSON.stringify([{ status: "resolution_initiated", timestamp: new Date().toISOString(), description }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET status = 'resolution_initiated',
         refund_status = CASE WHEN $2 = 'refund' THEN 'processing' ELSE refund_status END,
         timeline = COALESCE(timeline, '[]'::jsonb) || $3::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, resolutionType, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function completeResolution(id: string, resolutionType: ResolutionType, refundAmount?: number) {
  const description = resolutionType === "refund" ? `Refund of ₹${refundAmount} completed` : "Replacement delivered to buyer";
  const timelineEntry = JSON.stringify([{ status: "resolved", timestamp: new Date().toISOString(), description }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET status = 'resolved', resolved_at = now(),
         refund_status = CASE WHEN $2 = 'refund' THEN 'completed' ELSE refund_status END,
         refund_amount = COALESCE($3, refund_amount),
         timeline = COALESCE(timeline, '[]'::jsonb) || $4::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, resolutionType, refundAmount ?? null, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function addAdminNote(id: string, note: string): Promise<ReturnRequestRecord | null> {
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests SET admin_note = $2, updated_at = now() WHERE id = $1${returnReturning}`,
    [id, note]
  );
  return rows[0] ?? null;
}