import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";
import { createReturnRequest } from "@/postgres/repositories/returnRequests";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await query(
    `SELECT rr.*,
            rr.status AS "returnStatus",
            so.id AS "sellerOrderId",
            so.product_id AS "productId",
            so.total_price AS "totalPrice",
            p.name AS "productName",
            p.image AS "productImage",
            o.status AS "orderStatus",
            u.business_name AS "sellerName"
     FROM return_requests rr
     JOIN seller_orders so ON so.id = rr.seller_order_id
     JOIN orders o ON o.id = rr.order_id
     JOIN products p ON p.id = so.product_id
     JOIN seller_profiles u ON u.id = rr.seller_id
     WHERE rr.buyer_id = $1
     ORDER BY rr.created_at DESC`,
    [user.userId]
  );

  const mapRow = (r: any) => ({
    id: r.id,
    sellerOrderId: r.sellerOrderId,
    orderId: r.order_id,
    productId: r.productId,
    productName: r.productName,
    productImage: r.productImage,
    sellerName: r.sellerName,
    totalPrice: r.totalPrice,
    reason: r.reason,
    description: r.description,
    status: r.returnStatus,
    refundStatus: r.refund_status,
    refundAmount: r.refund_amount,
    pickupAddress: r.pickup_address,
    pickupScheduledAt: r.pickup_scheduled_at,
    pickupNotes: r.pickup_notes,
    timeline: r.timeline,
    createdAt: r.created_at,
  });

  return NextResponse.json({ returns: rows.map(mapRow) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sellerOrderId, orderId, reason, description, resolutionType } = body;

  if (!orderId || !reason || !resolutionType) {
    return NextResponse.json({ error: "orderId, reason, and resolutionType required" }, { status: 400 });
  }
  if (!["refund", "replacement"].includes(resolutionType)) {
    return NextResponse.json({ error: "resolutionType must be 'refund' or 'replacement'" }, { status: 400 });
  }

  let soId = sellerOrderId;
  if (!soId) {
    const { rows: soRows } = await query<{ id: string }>(
      `SELECT id FROM seller_orders WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    if (soRows.length === 0) {
      return NextResponse.json({ error: "No seller order found for this order" }, { status: 404 });
    }
    soId = soRows[0].id;
  }

  const { rows } = await query<{ id: string; seller_id: string; user_id: string }>(
    `SELECT so.id, so.seller_id, o.user_id
     FROM seller_orders so
     JOIN orders o ON o.id = so.order_id
     WHERE so.id = $1 AND o.user_id = $2`,
    [soId, user.userId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const ret = await createReturnRequest({
    sellerOrderId: soId,
    orderId,
    sellerId: rows[0].seller_id,
    buyerId: user.userId,
    reason,
    description,
    resolutionType,
  });

  return NextResponse.json({ success: true, return: ret }, { status: 201 });
}