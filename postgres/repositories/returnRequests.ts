import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { ReturnRequestRecord, ReturnStatus, RefundStatus } from "../models/ReturnRequest";

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
    refund_status AS "refundStatus",
    refund_amount AS "refundAmount",
    pickup_address AS "pickupAddress",
    pickup_scheduled_at AS "pickupScheduledAt",
    pickup_notes AS "pickupNotes",
    admin_note AS "adminNote",
    timeline,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM return_requests
`;

const returnReturning = `
  RETURNING id, seller_order_id AS "sellerOrderId", order_id AS "orderId",
    seller_id AS "sellerId", buyer_id AS "buyerId", reason, description, status,
    refund_status AS "refundStatus", refund_amount AS "refundAmount",
    pickup_address AS "pickupAddress", pickup_scheduled_at AS "pickupScheduledAt",
    pickup_notes AS "pickupNotes", admin_note AS "adminNote", timeline,
    created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function createReturnRequest(input: {
  sellerOrderId: string; orderId: string; sellerId: string; buyerId: string;
  reason: string; description?: string;
}): Promise<ReturnRequestRecord> {
  const { rows } = await query<ReturnRequestRecord>(
    `INSERT INTO return_requests (id, seller_order_id, order_id, seller_id, buyer_id, reason, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)${returnReturning}`,
    [randomUUID(), input.sellerOrderId, input.orderId, input.sellerId, input.buyerId, input.reason, input.description ?? null]
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

export async function updateReturnRequestStatus(
  id: string, status: ReturnStatus,
  refundStatus?: RefundStatus, refundAmount?: number
): Promise<ReturnRequestRecord | null> {
  const timelineEntry = JSON.stringify([{ status, timestamp: new Date().toISOString() }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET status = $2, refund_status = COALESCE($3, refund_status),
         refund_amount = COALESCE($4, refund_amount),
         timeline = timeline || $5::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, status, refundStatus ?? null, refundAmount ?? null, timelineEntry]
  );
  return rows[0] ?? null;
}

export async function schedulePickup(
  id: string, pickupAddress: string, pickupScheduledAt: Date, pickupNotes?: string
): Promise<ReturnRequestRecord | null> {
  const timelineEntry = JSON.stringify([{ status: "picked_up", timestamp: new Date().toISOString(), address: pickupAddress, notes: pickupNotes }]);
  const { rows } = await query<ReturnRequestRecord>(
    `UPDATE return_requests
     SET status = 'picked_up', pickup_address = $2, pickup_scheduled_at = $3,
         pickup_notes = $4, timeline = timeline || $5::jsonb, updated_at = now()
     WHERE id = $1${returnReturning}`,
    [id, pickupAddress, pickupScheduledAt, pickupNotes ?? null, timelineEntry]
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
