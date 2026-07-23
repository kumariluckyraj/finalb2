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

export async function markMessageRead(id: string, sellerId: string): Promise<void> {
  await query(
    `UPDATE seller_messages SET is_read = true WHERE id = $1 AND seller_id = $2`,
    [id, sellerId]
  );
}

export async function countUnreadMessages(sellerId: string): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM seller_messages WHERE seller_id = $1 AND is_read = false AND direction = 'incoming'`,
    [sellerId]
  );
  return rows[0].count;
}

export async function sendAdminMessageToSeller(
  sellerId: string,
  subject: string,
  body: string
): Promise<SellerMessageRecord> {
  return createMessage({
    sellerId,
    subject,
    body,
    direction: "incoming",
    senderType: "support",
  });
}

// NEW: admin broadcasts to every seller in one shot (single round trip via unnest)
export async function broadcastMessageToAllSellers(
  subject: string,
  body: string,
  sellerIds: string[]
): Promise<SellerMessageRecord[]> {
  const broadcastId = randomUUID();
  const ids = sellerIds.map(() => randomUUID());

  const { rows } = await query<SellerMessageRecord>(
    `INSERT INTO seller_messages (
      id,
      seller_id,
      subject,
      body,
      direction,
      sender_type,
      broadcast_id
    )
    SELECT * FROM unnest(
      $1::uuid[],
      $2::uuid[],
      $3::text[],
      $4::text[],
      $5::text[],
      $6::text[],
      $7::uuid[]
    )${msgReturning}`,
    [
      ids,
      sellerIds,
      sellerIds.map(() => subject),
      sellerIds.map(() => body),
      sellerIds.map(() => "incoming"),
      sellerIds.map(() => "support"),
      sellerIds.map(() => broadcastId),
    ]
  );

  return rows;
}

// NEW: admin dashboard — list past broadcasts (grouped)
export async function listBroadcasts(): Promise<
  {
    broadcastId: string;
    subject: string;
    body: string;
    createdAt: Date;
    recipientCount: number;
  }[]
> {
  const { rows } = await query<{
    broadcastId: string;
    subject: string;
    body: string;
    createdAt: Date;
    recipientCount: number;
  }>(
    `SELECT
        broadcast_id AS "broadcastId",
        subject,
        body,
        MIN(created_at) AS "createdAt",
        COUNT(*)::int AS "recipientCount"
     FROM seller_messages
     WHERE broadcast_id IS NOT NULL
     GROUP BY broadcast_id, subject, body
     ORDER BY MIN(created_at) DESC`
  );

  return rows;
}

export async function listMessagesForAdmin(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<(SellerMessageRecord & { sellerName?: string })[]> {
  const conditions = ["sm.direction = 'outgoing'", "sm.sender_type = 'seller'"];
  const params: any[] = [];
  let paramIndex = 1;

  if (options?.unreadOnly) {
    conditions.push("sm.is_read = false");
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const { rows } = await query<SellerMessageRecord & { sellerName?: string }>(
    `SELECT
       sm.id, sm.seller_id AS "sellerId", sm.user_id AS "userId", sm.order_id AS "orderId",
       sm.subject, sm.body, sm.direction, sm.sender_type AS "senderType",
       sm.is_read AS "isRead", sm.created_at AS "createdAt",
       sp.business_name AS "sellerName"
     FROM seller_messages sm
     LEFT JOIN seller_profiles sp ON sp.id = sm.seller_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY sm.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

// admin marks a seller's message as read (no sellerId ownership check — admin can read any)
export async function markMessageReadAsAdmin(id: string): Promise<void> {
  await query(`UPDATE seller_messages SET is_read = true WHERE id = $1`, [id]);
}