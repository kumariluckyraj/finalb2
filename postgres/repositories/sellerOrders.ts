import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateSellerOrderInput, SellerOrderRecord, SellerOrderStatus } from "../models/SellerOrder";

const orderSelect = `
  SELECT
    id,
    order_id AS "orderId",
    seller_id AS "sellerId",
    product_id AS "productId",
    variant_id AS "variantId",
    quantity,
    unit_price AS "unitPrice",
    total_price AS "totalPrice",
    commission_percent AS "commissionPercent",
    commission_amount AS "commissionAmount",
    shipping_charge AS "shippingCharge",
    tax_amount AS "taxAmount",
    net_amount AS "netAmount",
    status,
    tracking_number AS "trackingNumber",
    tracking_company AS "trackingCompany",
    shipping_label_url AS "shippingLabelUrl",
    invoice_url AS "invoiceUrl",
    shiprocket_order_id AS "shiprocketOrderId",
    shiprocket_shipment_id AS "shiprocketShipmentId",
    buyer_note AS "buyerNote",
    seller_note AS "sellerNote",
    is_issue_raised AS "isIssueRaised",
    issue_reason AS "issueReason",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM seller_orders
`;

export async function createSellerOrder(input: CreateSellerOrderInput): Promise<SellerOrderRecord> {
  const { rows } = await query<SellerOrderRecord>(
    `
      INSERT INTO seller_orders (id, order_id, seller_id, product_id, variant_id, quantity, unit_price, total_price, commission_percent, commission_amount, shipping_charge, tax_amount, net_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, order_id AS "orderId", seller_id AS "sellerId", product_id AS "productId", variant_id AS "variantId", quantity, unit_price AS "unitPrice", total_price AS "totalPrice", commission_percent AS "commissionPercent", commission_amount AS "commissionAmount", shipping_charge AS "shippingCharge", tax_amount AS "taxAmount", net_amount AS "netAmount", status, tracking_number AS "trackingNumber", tracking_company AS "trackingCompany", shipping_label_url AS "shippingLabelUrl", invoice_url AS "invoiceUrl", shiprocket_order_id AS "shiprocketOrderId", shiprocket_shipment_id AS "shiprocketShipmentId", buyer_note AS "buyerNote", seller_note AS "sellerNote", is_issue_raised AS "isIssueRaised", issue_reason AS "issueReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.orderId,
      input.sellerId,
      input.productId,
      input.variantId ?? null,
      input.quantity,
      input.unitPrice,
      input.totalPrice,
      input.commissionPercent ?? 0,
      input.commissionAmount ?? 0,
      input.shippingCharge ?? 0,
      input.taxAmount ?? 0,
      input.netAmount ?? input.totalPrice,
      input.status ?? "new",
    ]
  );
  return rows[0];
}

export async function listSellerOrders(sellerId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<SellerOrderRecord[]> {
  const conditions: string[] = ["seller_id = $1"];
  const params: unknown[] = [sellerId];
  let idx = 2;

  if (options?.status) {
    conditions.push(`status = $${idx}`);
    params.push(options.status);
    idx++;
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const { rows } = await query<SellerOrderRecord>(
    `${orderSelect} WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  return rows;
}

export async function findSellerOrderById(id: string): Promise<SellerOrderRecord | null> {
  const { rows } = await query<SellerOrderRecord>(`${orderSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findSellerOrderByOrderId(orderId: string): Promise<SellerOrderRecord | null> {
  const { rows } = await query<SellerOrderRecord>(`${orderSelect} WHERE order_id = $1`, [orderId]);
  return rows[0] ?? null;
}

export async function updateSellerOrderStatus(id: string, status: SellerOrderStatus): Promise<SellerOrderRecord | null> {
  const { rows } = await query<SellerOrderRecord>(
    `
      UPDATE seller_orders
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, order_id AS "orderId", seller_id AS "sellerId", product_id AS "productId", variant_id AS "variantId", quantity, unit_price AS "unitPrice", total_price AS "totalPrice", commission_percent AS "commissionPercent", commission_amount AS "commissionAmount", shipping_charge AS "shippingCharge", tax_amount AS "taxAmount", net_amount AS "netAmount", status, tracking_number AS "trackingNumber", tracking_company AS "trackingCompany", shipping_label_url AS "shippingLabelUrl", invoice_url AS "invoiceUrl", shiprocket_order_id AS "shiprocketOrderId", shiprocket_shipment_id AS "shiprocketShipmentId", buyer_note AS "buyerNote", seller_note AS "sellerNote", is_issue_raised AS "isIssueRaised", issue_reason AS "issueReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function updateSellerOrderTracking(id: string, data: { trackingNumber: string; trackingCompany?: string }): Promise<SellerOrderRecord | null> {
  const { rows } = await query<SellerOrderRecord>(
    `
      UPDATE seller_orders
      SET tracking_number = $2, tracking_company = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, order_id AS "orderId", seller_id AS "sellerId", product_id AS "productId", variant_id AS "variantId", quantity, unit_price AS "unitPrice", total_price AS "totalPrice", commission_percent AS "commissionPercent", commission_amount AS "commissionAmount", shipping_charge AS "shippingCharge", tax_amount AS "taxAmount", net_amount AS "netAmount", status, tracking_number AS "trackingNumber", tracking_company AS "trackingCompany", shipping_label_url AS "shippingLabelUrl", invoice_url AS "invoiceUrl", shiprocket_order_id AS "shiprocketOrderId", shiprocket_shipment_id AS "shiprocketShipmentId", buyer_note AS "buyerNote", seller_note AS "sellerNote", is_issue_raised AS "isIssueRaised", issue_reason AS "issueReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, data.trackingNumber, data.trackingCompany ?? null]
  );
  return rows[0] ?? null;
}

export async function updateSellerOrderShiprocketTracking(
  id: string,
  data: {
    trackingNumber: string;
    trackingCompany: string;
    shippingLabelUrl: string | null;
    invoiceUrl: string | null;
    shiprocketOrderId: string;
    shiprocketShipmentId: string;
  }
): Promise<SellerOrderRecord | null> {
  const { rows } = await query<SellerOrderRecord>(
    `
      UPDATE seller_orders
      SET
        tracking_number = $2,
        tracking_company = $3,
        shipping_label_url = $4,
        invoice_url = $5,
        shiprocket_order_id = $6,
        shiprocket_shipment_id = $7,
        status = 'confirmed',
        updated_at = now()
      WHERE id = $1
      RETURNING id, order_id AS "orderId", seller_id AS "sellerId", product_id AS "productId", variant_id AS "variantId", quantity, unit_price AS "unitPrice", total_price AS "totalPrice", commission_percent AS "commissionPercent", commission_amount AS "commissionAmount", shipping_charge AS "shippingCharge", tax_amount AS "taxAmount", net_amount AS "netAmount", status, tracking_number AS "trackingNumber", tracking_company AS "trackingCompany", shipping_label_url AS "shippingLabelUrl", invoice_url AS "invoiceUrl", shiprocket_order_id AS "shiprocketOrderId", shiprocket_shipment_id AS "shiprocketShipmentId", buyer_note AS "buyerNote", seller_note AS "sellerNote", is_issue_raised AS "isIssueRaised", issue_reason AS "issueReason", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, data.trackingNumber, data.trackingCompany, data.shippingLabelUrl, data.invoiceUrl, data.shiprocketOrderId, data.shiprocketShipmentId]
  );
  return rows[0] ?? null;
}

export async function countSellerOrders(sellerId: string, status?: string): Promise<number> {
  let sql = `SELECT COUNT(*)::int AS count FROM seller_orders WHERE seller_id = $1`;
  const params: unknown[] = [sellerId];
  if (status) {
    sql += ` AND status = $2`;
    params.push(status);
  }
  const { rows } = await query<{ count: number }>(sql, params);
  return rows[0].count;
}

export async function getSellerOrderStats(sellerId: string): Promise<{ totalOrders: number; revenue: number; pendingOrders: number; pendingShipments: number; returns: number }> {
  const { rows } = await query<Record<string, unknown>>(
    `
      SELECT
        COUNT(*)::int AS "totalOrders",
        COALESCE(SUM(total_price), 0)::float8 AS revenue,
        COUNT(*) FILTER (WHERE status = 'new')::int AS "pendingOrders",
        COUNT(*) FILTER (WHERE status = 'confirmed' OR status = 'packed')::int AS "pendingShipments",
        COUNT(*) FILTER (WHERE status = 'returned')::int AS returns
      FROM seller_orders
      WHERE seller_id = $1
    `,
    [sellerId]
  );
  const row = rows[0];
  return {
    totalOrders: Number(row.totalOrders),
    revenue: Number(row.revenue),
    pendingOrders: Number(row.pendingOrders),
    pendingShipments: Number(row.pendingShipments),
    returns: Number(row.returns),
  };
}
