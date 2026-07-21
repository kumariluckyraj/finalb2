import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateReviewInput, ReviewFilters, ReviewRecord } from "../models/Review";

const reviewSelect = `
  SELECT
    id,
    product_id AS "productId",
    user_id AS "userId",
    user_name AS "userName",
    rating,
    comment,
    images,
    video,
    helpful_count AS "helpfulCount",
    verified,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM reviews
`;

const reviewReturning = `
  RETURNING id, product_id AS "productId", user_id AS "userId", user_name AS "userName",
    rating, comment, images, video, helpful_count AS "helpfulCount",
    verified, created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function createReview(input: CreateReviewInput): Promise<ReviewRecord> {
  const id = input.id ?? randomUUID();
  const { rows } = await query<ReviewRecord>(
    `INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, images, video, verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)${reviewReturning}`,
    [id, input.productId ?? null, input.userId ?? null, input.userName ?? null,
     input.rating ?? null, input.comment ?? null, input.images ?? [],
     input.video ?? null, input.verified ?? false]
  );
  return rows[0];
}

export async function listReviewsByProductId(
  productId: string,
  filters?: ReviewFilters
): Promise<ReviewRecord[]> {
  const conditions: string[] = ["product_id = $1"];
  const params: unknown[] = [productId];
  let paramIdx = 2;

  if (filters?.rating) {
    conditions.push(`rating = $${paramIdx++}`);
    params.push(filters.rating);
  }

  if (filters?.hasMedia) {
    conditions.push(`(array_length(images, 1) > 0 OR video IS NOT NULL)`);
  }

  let orderBy = "created_at DESC";
  if (filters?.sort === "highest") orderBy = "rating DESC, created_at DESC";
  else if (filters?.sort === "lowest") orderBy = "rating ASC, created_at DESC";

  const { rows } = await query<ReviewRecord>(
    `${reviewSelect} WHERE ${conditions.join(" AND ")} ORDER BY ${orderBy}`,
    params
  );
  return rows;
}

export async function listReviews(): Promise<ReviewRecord[]> {
  const { rows } = await query<ReviewRecord>(`${reviewSelect} ORDER BY created_at DESC`);
  return rows;
}

export async function getReviewAnalytics(productId: string) {
  const { rows } = await query<{ rating: number; count: string }>(
    `SELECT rating, COUNT(*)::text AS count FROM reviews WHERE product_id = $1 GROUP BY rating ORDER BY rating`,
    [productId]
  );
  const total = rows.reduce((s, r) => s + parseInt(r.count), 0);
  const avg = total > 0
    ? rows.reduce((s, r) => s + r.rating * parseInt(r.count), 0) / total
    : 0;
  return { distribution: rows.map(r => ({ rating: r.rating, count: parseInt(r.count) })), average: avg, total };
}

export async function incrementHelpfulCount(reviewId: string): Promise<void> {
  await query(`UPDATE reviews SET helpful_count = helpful_count + 1, updated_at = now() WHERE id = $1`, [reviewId]);
}

export async function deleteReview(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM reviews WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}
