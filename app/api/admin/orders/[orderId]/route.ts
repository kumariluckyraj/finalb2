import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { updateOrderStatusWithTracking } from "@/postgres/repositories/orders";
import { toApiOrder } from "@/lib/apiTransform";
import { fulfillSellerOrders } from "@/lib/shiprocket/service";

const STATUS_EVENTS: Record<string, { label: string; description: string }> = {
  confirmed:        { label: "Order Confirmed",    description: "Your order has been placed." },
  processed:        { label: "Order Processed",    description: "Seller has processed your order." },
  picked_up:        { label: "Picked Up",          description: "Your item has been picked up by delivery partner." },
  shipped:          { label: "Shipped",            description: "Your item has been shipped." },
  hub:              { label: "Reached Hub",        description: "Your item has been received in the hub nearest to you." },
  out_for_delivery: { label: "Out for Delivery",   description: "Your item is out for delivery." },
  delivered:        { label: "Delivered",          description: "Your item has been delivered." },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await params;
  const { status } = await req.json();

  const event = STATUS_EVENTS[status];
  if (!event) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const order = await updateOrderStatusWithTracking(orderId, status, event.label, event.description);

  if (status === "confirmed") {
    fulfillSellerOrders(orderId).catch((err) => {
      console.error(`ShipRocket fulfillment failed for order ${orderId}:`, err);
    });
  }

  return NextResponse.json({ order: order ? toApiOrder(order) : null });
}
