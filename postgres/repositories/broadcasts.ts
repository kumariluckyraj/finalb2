import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { BroadcastRecord } from "../models/Broadcast";

export async function createBroadcast(input: {
  adminId: string; subject: string; body: string;
}): Promise<BroadcastRecord> {
  const { rows } = await query<BroadcastRecord>(
    `INSERT INTO broadcasts (id, admin_id, subject, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id, admin_id AS "adminId", subject, body,
       target_seller_count AS "targetSellerCount",
       sent_count AS "sentCount",
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    [randomUUID(), input.adminId, input.subject, input.body]
  );
  return rows[0];
}

export async function updateBroadcastCounts(id: string, targetCount: number, sentCount: number): Promise<void> {
  await query(
    `UPDATE broadcasts SET target_seller_count = $2, sent_count = sent_count + $3, updated_at = now() WHERE id = $1`,
    [id, targetCount, sentCount]
  );
}

export async function listBroadcasts(): Promise<BroadcastRecord[]> {
  const { rows } = await query<BroadcastRecord>(
    `SELECT id, admin_id AS "adminId", subject, body,
       target_seller_count AS "targetSellerCount",
       sent_count AS "sentCount",
       created_at AS "createdAt", updated_at AS "updatedAt"
     FROM broadcasts ORDER BY created_at DESC`
  );
  return rows;
}
