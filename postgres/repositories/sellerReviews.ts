import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { SellerReviewRecord } from "../models/SellerReview";

const reviewSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    store_id AS "storeId",
    user_id AS "userId",
    order_id AS "orderId",
    rating,
    comment,
    seller_reply AS "sellerReply",
    seller_replied_at AS "sellerRepliedAt",
    is_flagged AS "isFlagged",
    flag_reason AS "flagReason",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM seller_reviews
`;

export async function listSellerReviews(sellerId: string): Promise<SellerReviewRecord[]> {
  const { rows } = await query<SellerReviewRecord>(`${reviewSelect} WHERE seller_id = $1 ORDER BY created_at DESC`, [sellerId]);
  return rows;
}

export async function replyToReview(id: string, reply: string): Promise<SellerReviewRecord | null> {
  const { rows } = await query<SellerReviewRecord>(
    `
      UPDATE seller_reviews
      SET seller_reply = $2, seller_replied_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING id, seller_id AS "sellerId", store_id AS "storeId", user_id AS "userId", order_id AS "orderId", rating, comment, seller_reply AS "sellerReply", seller_replied_at AS "sellerRepliedAt", is_flagged AS "isFlagged", flag_reason AS "flagReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, reply]
  );
  return rows[0] ?? null;
}

export async function flagReview(id: string, reason: string): Promise<SellerReviewRecord | null> {
  const { rows } = await query<SellerReviewRecord>(
    `
      UPDATE seller_reviews
      SET is_flagged = true, flag_reason = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, seller_id AS "sellerId", store_id AS "storeId", user_id AS "userId", order_id AS "orderId", rating, comment, seller_reply AS "sellerReply", seller_replied_at AS "sellerRepliedAt", is_flagged AS "isFlagged", flag_reason AS "flagReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, reason]
  );
  return rows[0] ?? null;
}

export async function getStoreRating(storeId: string): Promise<{ average: number; count: number }> {
  const { rows } = await query<Record<string, unknown>>(
    `SELECT COALESCE(AVG(rating), 0)::float8 AS average, COUNT(*)::int AS count FROM seller_reviews WHERE store_id = $1`,
    [storeId]
  );
  return { average: Number(rows[0].average), count: Number(rows[0].count) };
}

export async function getSellerReviewsAnalytics(sellerId: string): Promise<{
  distribution: { rating: number; count: number }[];
  monthlyTrend: { month: string; count: number; avgRating: number }[];
  totalReviews: number;
  avgRating: number;
  repliedCount: number;
  flaggedCount: number;
  pendingReplyCount: number;
}> {
  const dist = await query<{ rating: number; count: string }>(
    `SELECT rating, COUNT(*)::text AS count FROM seller_reviews WHERE seller_id = $1 GROUP BY rating ORDER BY rating`,
    [sellerId]
  );
  const monthly = await query<{ month: string; count: string; avgRating: string }>(
    `SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::text AS count, AVG(rating)::float8::text AS "avgRating" FROM seller_reviews WHERE seller_id = $1 GROUP BY month ORDER BY month DESC LIMIT 6`,
    [sellerId]
  );
  const totals = await query<{ total: string; avg: string; replied: string; flagged: string; pending: string }>(
    `SELECT COUNT(*)::text AS total, COALESCE(AVG(rating), 0)::float8::text AS avg,
            COUNT(*) FILTER (WHERE seller_reply IS NOT NULL)::text AS replied,
            COUNT(*) FILTER (WHERE is_flagged)::text AS flagged,
            COUNT(*) FILTER (WHERE seller_reply IS NULL)::text AS pending
     FROM seller_reviews WHERE seller_id = $1`,
    [sellerId]
  );
  const t = totals.rows[0];
  return {
    distribution: dist.rows.map(r => ({ rating: r.rating, count: parseInt(r.count) })),
    monthlyTrend: monthly.rows.map(m => ({ month: m.month, count: parseInt(m.count), avgRating: parseFloat(m.avgRating) })),
    totalReviews: parseInt(t.total),
    avgRating: parseFloat(t.avg),
    repliedCount: parseInt(t.replied),
    flaggedCount: parseInt(t.flagged),
    pendingReplyCount: parseInt(t.pending),
  };
}
