import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { query } from "@/postgres/lib/db";
import { createSellerOrder } from "@/postgres/repositories/sellerOrders";
import { findOrderById } from "@/postgres/repositories/orders";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Provide ?orderId=<uuid>" }, { status: 400 });
    }

    const order = await findOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { rows: profiles } = await query<{
      id: string;
      userId: string;
      businessName: string;
      pincode: string;
      phone: string;
    }>(
      `SELECT id, user_id AS "userId", business_name AS "businessName", pincode, phone
       FROM seller_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [order.vendorId]
    );

    let sellerId: string;
    let sellerPincode: string;

    if (profiles.length > 0) {
      sellerId = profiles[0].id;
      sellerPincode = profiles[0].pincode;
    } else {
      const { rows: fallback } = await query<{ id: string; userId: string; businessName: string; pincode: string }>(
        `SELECT id, user_id AS "userId", business_name AS "businessName", pincode
         FROM seller_profiles WHERE status = 'active' LIMIT 1`
      );
      if (fallback.length === 0) {
        return NextResponse.json({
          error: "No seller_profiles found. Register as a seller first via /sell-online",
        }, { status: 400 });
      }
      sellerId = fallback[0].id;
      sellerPincode = fallback[0].pincode;
    }

    const { rows: products } = await query<{ id: string; name: string; sellingPrice: number; weight: number }>(
      `SELECT sp.id, sp.name, sp.selling_price::float8 AS "sellingPrice", sp.weight::float8 AS weight
       FROM seller_products sp
       WHERE sp.seller_id = $1 AND sp.status = 'active'
       LIMIT 1`,
      [sellerId]
    );

    let productId: string;
    let unitPrice: number;
    let productName: string;

    if (products.length > 0) {
      productId = products[0].id;
      unitPrice = products[0].sellingPrice;
      productName = products[0].name;
    } else {
      return NextResponse.json({
        error: `No active seller_products found for seller ${sellerId}. Add a product via vendor dashboard first.`,
      }, { status: 400 });
    }

    const { rows: existing } = await query(
      `SELECT id FROM seller_orders WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    if (existing.length > 0) {
      return NextResponse.json({
        message: "seller_order already exists",
        sellerOrderId: existing[0].id,
        orderId,
      });
    }

    const sellerOrder = await createSellerOrder({
      orderId,
      sellerId,
      productId,
      quantity: order.quantity,
      unitPrice,
      totalPrice: unitPrice * order.quantity,
    });

    return NextResponse.json({
      message: "seller_order created successfully",
      sellerOrderId: sellerOrder.id,
      orderId,
      sellerId,
      productId,
      productName,
      quantity: order.quantity,
      unitPrice,
      note: `Now run: GET /api/shiprocket/test-fulfill?orderId=${orderId}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
