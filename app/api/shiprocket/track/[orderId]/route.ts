import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { trackShipment } from "@/lib/shiprocket/service";
import { query } from "@/postgres/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { orderId } = await params;

    const { rows } = await query<{ tracking_number: string | null; tracking_company: string | null }>(
      `SELECT tracking_number, tracking_company FROM seller_orders WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );

    const row = rows[0];
    if (!row?.tracking_number) {
      return NextResponse.json({ tracking: null, message: "No tracking number assigned yet" });
    }

    const tracking = await trackShipment(row.tracking_number);

    return NextResponse.json({
      tracking: tracking.tracking_data,
      courierName: row.tracking_company,
      awb: row.tracking_number,
    });
  } catch (err) {
    console.error("ShipRocket track error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tracking" },
      { status: 500 }
    );
  }
}
