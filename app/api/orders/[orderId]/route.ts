import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findOrderById } from "@/postgres/repositories/orders";
import { toApiOrder } from "@/lib/apiTransform";
import { query } from "@/postgres/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);

  const { orderId } = await params;
  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "admin" && order.userId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await query<{
    tracking_number: string | null;
    tracking_company: string | null;
    shipping_label_url: string | null;
    invoice_url: string | null;
    id: string;
  }>(
    `SELECT id, tracking_number, tracking_company, shipping_label_url, invoice_url FROM seller_orders WHERE order_id = $1 LIMIT 1`,
    [orderId]
  );

  const apiOrder = toApiOrder(order);
  const trackingInfo = rows[0];

  return NextResponse.json({
    order: {
      ...apiOrder,
      trackingNumber: trackingInfo?.tracking_number ?? null,
      courierName: trackingInfo?.tracking_company ?? null,
      shippingLabelUrl: trackingInfo?.shipping_label_url ?? null,
      invoiceUrl: trackingInfo?.invoice_url ?? null,
      sellerOrderId: trackingInfo?.id ?? null,
    },
  });
}
