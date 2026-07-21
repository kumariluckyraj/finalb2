import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { SellerMessageRecord } from "../models/SellerMessage";

const msgSelect = `
  SELECT
    id, seller_id AS "sellerId", user_id AS "userId", order_id AS "orderId",
    broadcast_id AS "broadcastId",
    subject, body, direction, sender_type AS "senderType",
    is_read AS "isRead", created_at AS "createdAt"
  FROM seller_messages
`;

const msgReturning = `
  RETURNING id, seller_id AS "sellerId", user_id AS "userId", order_id AS "orderId",
    broadcast_id AS "broadcastId",
    subject, body, direction, sender_type AS "senderType",
    is_read AS "isRead", created_at AS "createdAt"
`;

export async function createMessage(input: {
  sellerId: string; userId?: string; orderId?: string; broadcastId?: string;
  subject: string; body: string; direction: "incoming" | "outgoing";
  senderType: "seller" | "buyer" | "support";
}): Promise<SellerMessageRecord> {
  const { rows } = await query<SellerMessageRecord>(
    `INSERT INTO seller_messages (id, seller_id, user_id, order_id, broadcast_id, subject, body, direction, sender_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)${msgReturning}`,
    [randomUUID(), input.sellerId, input.userId ?? null, input.orderId ?? null,
     input.broadcastId ?? null, input.subject, input.body, input.direction, input.senderType]
  );
  return rows[0];
}

export async function listMessagesBySeller(sellerId: string): Promise<SellerMessageRecord[]> {
  const { rows } = await query<SellerMessageRecord>(
    `${msgSelect} WHERE seller_id = $1 ORDER BY created_at DESC`,
    [sellerId]
  );
  return rows;
}

export async function markMessageRead(id: string): Promise<void> {
  await query(`UPDATE seller_messages SET is_read = true WHERE id = $1`, [id]);
}

export async function countUnreadMessages(sellerId: string): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM seller_messages WHERE seller_id = $1 AND is_read = false AND direction = 'incoming'`,
    [sellerId]
  );
  return rows[0].count;
}
