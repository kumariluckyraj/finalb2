import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listAllOrders } from "@/postgres/repositories/orders";
import { toApiOrder } from "@/lib/apiTransform";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orders = await listAllOrders();

  const orderIds = orders.map((o) => o.id);
  const { rows: trackingRows } = await query<{
    order_id: string;
    tracking_number: string | null;
    tracking_company: string | null;
    shipping_label_url: string | null;
    invoice_url: string | null;
  }>(
    `SELECT order_id, tracking_number, tracking_company, shipping_label_url, invoice_url FROM seller_orders WHERE order_id = ANY($1::text[])`,
    [orderIds]
  );

  const trackingMap = new Map(trackingRows.map((r) => [r.order_id, r]));

  const apiOrders = orders.map((order) => {
    const t = trackingMap.get(order.id);
    return {
      ...toApiOrder(order),
      trackingNumber: t?.tracking_number ?? null,
      courierName: t?.tracking_company ?? null,
      shippingLabelUrl: t?.shipping_label_url ?? null,
      invoiceUrl: t?.invoice_url ?? null,
    };
  });

  return NextResponse.json({ orders: apiOrders });
}
