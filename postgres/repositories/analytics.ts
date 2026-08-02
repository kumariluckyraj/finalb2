import { query } from "../lib/db";
import crypto from "crypto";

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function upsertVisitorSession(params: {
  visitorId: string;
  path: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userAgent?: string;
  ipHash?: string;
}) {
  await query(
    `INSERT INTO visitor_sessions
       (visitor_id, landing_path, last_path, referrer, utm_source, utm_medium, utm_campaign, user_agent, ip_hash)
     VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (visitor_id) DO UPDATE SET
       last_path = $2,
       last_seen = now(),
       visit_count = visitor_sessions.visit_count + 1`,
    [
      params.visitorId,
      params.path,
      params.referrer ?? null,
      params.utmSource ?? null,
      params.utmMedium ?? null,
      params.utmCampaign ?? null,
      params.userAgent ?? null,
      params.ipHash ?? null,
    ]
  );
}

export async function logPageView(params: {
  visitorId: string;
  path: string;
  productId?: string;
  eventType?: string;
}) {
  await query(
    `INSERT INTO visitor_page_views (visitor_id, path, product_id, event_type)
     VALUES ($1, $2, $3, $4)`,
    [params.visitorId, params.path, params.productId ?? null, params.eventType ?? "page_view"]
  );
}

export async function markVisitorConverted(visitorId: string, userId: string) {
  await query(
    `UPDATE visitor_sessions SET converted_user_id = $2 WHERE visitor_id = $1`,
    [visitorId, userId]
  );
}

export async function listVisitorSessionsForExport(days: number = 30) {
  const { rows } = await query<any>(
    `SELECT visitor_id, first_seen, last_seen, visit_count, landing_path, last_path,
            referrer, utm_source, utm_medium, utm_campaign, user_agent, converted_user_id
     FROM visitor_sessions
     WHERE last_seen >= now() - ($1 || ' days')::interval
     ORDER BY last_seen DESC`,
    [days]
  );
  return rows;
}

export async function listPageViewsForExport(days: number = 30) {
  const { rows } = await query<any>(
    `SELECT visitor_id, path, product_id, event_type, created_at
     FROM visitor_page_views
     WHERE created_at >= now() - ($1 || ' days')::interval
     ORDER BY created_at DESC
     LIMIT 20000`,
    [days]
  );
  return rows;
}