import { NextRequest, NextResponse } from "next/server";
import { query } from "@/postgres/lib/db";

interface ShipRocketWebhookPayload {
  order_id?: string;
  shipment_id?: string;
  awb_code?: string;
  courier_name?: string;
  current_status?: string;
  status?: string;
  delivered?: boolean;
  track?: { status: string; activity: string; location: string; date: string; time: string }[];
}

const SHIPROCKET_STATUS_MAP: Record<string, string> = {
  "NEW": "confirmed",
  "PICKED UP": "picked_up",
  "SHIPPED": "shipped",
  "IN TRANSIT": "shipped",
  "OUT FOR DELIVERY": "out_for_delivery",
  "DELIVERED": "delivered",
  "CANCELLED": "cancelled",
  "RTO": "cancelled",
  "RTO DELIVERED": "cancelled",
};

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === "change-me-to-a-random-secret") {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (authHeader !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload: ShipRocketWebhookPayload = await req.json();
    const awb = payload.awb_code;

    if (!awb) {
      return NextResponse.json({ error: "Missing awb_code" }, { status: 400 });
    }

    const currentStatus = payload.current_status ?? payload.status ?? "";
    const mappedStatus = SHIPROCKET_STATUS_MAP[currentStatus.toUpperCase()];

    if (mappedStatus) {
      const label = statusLabel(mappedStatus);
      await query(
        `UPDATE seller_orders SET status = $2, updated_at = now() WHERE tracking_number = $1`,
        [awb, mappedStatus]
      );

      const { rows } = await query<{ order_id: string }>(
        `SELECT order_id FROM seller_orders WHERE tracking_number = $1 LIMIT 1`,
        [awb]
      );

      if (rows.length > 0) {
        const orderId = rows[0].order_id;
        await query(
          `INSERT INTO order_tracking_events (id, order_id, status, label, description, timestamp)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, now())`,
          [orderId, mappedStatus, label, `ShipRocket: ${currentStatus}`]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("ShipRocket webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: "Order Confirmed",
    picked_up: "Picked Up",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}
