import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findOrderById } from "@/postgres/repositories/orders";
import { findSellerOrderByOrderId } from "@/postgres/repositories/sellerOrders";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { findSellerProductById } from "@/postgres/repositories/sellerProducts";
import { shiprocketFetch } from "@/lib/shiprocket/client";
import type {
  ShipRocketCreateOrderPayload,
  ShipRocketCreateOrderResponse,
  ShipRocketAssignAwbResponse,
  ShipRocketPickupResponse,
  ShipRocketLabelResponse,
  ShipRocketInvoiceResponse,
} from "@/lib/shiprocket/types";

function getDefaultDimensions() {
  return { length: 10, breadth: 10, height: 10, weight: 0.5 };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { error: "Provide ?orderId=<order-uuid> to test fulfillment" },
        { status: 400 }
      );
    }

    const log: Record<string, unknown>[] = [];
    function step(name: string, data: Record<string, unknown>) {
      log.push({ step: name, ...data });
    }

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: `Order ${orderId} not found` }, { status: 404 });
  step("findOrderById", { found: true, id: order.id, status: order.status });

  const sellerOrder = await findSellerOrderByOrderId(orderId);
  if (!sellerOrder)
    return NextResponse.json({ error: `No seller_order for order ${orderId}` }, { status: 404 });
  step("findSellerOrderByOrderId", {
    found: true,
    id: sellerOrder.id,
    sellerId: sellerOrder.sellerId,
    productId: sellerOrder.productId,
    quantity: sellerOrder.quantity,
  });

  const sellerProfile = await findSellerProfileById(sellerOrder.sellerId);
  if (!sellerProfile)
    return NextResponse.json({ error: `Seller profile not found for ${sellerOrder.sellerId}` }, { status: 404 });
  step("findSellerProfile", {
    found: true,
    businessName: sellerProfile.businessName,
    pincode: sellerProfile.pincode,
    phone: sellerProfile.phone,
  });

  const sellerProduct = sellerOrder.productId
    ? await findSellerProductById(sellerOrder.productId)
    : null;
  step("findSellerProduct", {
    found: !!sellerProduct,
    name: sellerProduct?.name ?? "(no product linked)",
    sku: sellerProduct?.sku ?? "N/A",
    weight: sellerProduct?.weight,
    dimensions: sellerProduct?.length && sellerProduct?.width && sellerProduct?.height
      ? `${sellerProduct.length}x${sellerProduct.width}x${sellerProduct.height}`
      : "defaults will be used",
  });

  const dims = sellerProduct?.weight
    ? {
        length: Number(sellerProduct.length) || 10,
        breadth: Number(sellerProduct.width) || 10,
        height: Number(sellerProduct.height) || 10,
        weight: Number(sellerProduct.weight),
      }
    : getDefaultDimensions();

  const pickupLocation = sellerProfile.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 30);

  const customerName = order.address?.fullName ?? "Customer";
  const nameParts = customerName.split(" ");
  const firstName = nameParts[0] ?? customerName;
  const lastName = nameParts.slice(1).join(" ") || " ";

  const createPayload: ShipRocketCreateOrderPayload = {
    order_id: `TEST-${orderId.slice(0, 8)}-${sellerOrder.id.slice(0, 4)}`,
    order_date: new Date().toISOString().split("T")[0],
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: order.address?.line1 ?? "",
    billing_address_2: order.address?.line2 ?? "",
    billing_city: order.address?.city ?? "",
    billing_state: order.address?.state ?? "",
    billing_pincode: order.address?.pincode ?? "",
    billing_country: "India",
    billing_email: "",
    billing_phone: order.address?.phone ?? "",
    shipping_is_billing: true,
    shipping_customer_name: firstName,
    shipping_last_name: lastName,
    shipping_address: order.address?.line1 ?? "",
    shipping_address_2: order.address?.line2 ?? "",
    shipping_city: order.address?.city ?? "",
    shipping_state: order.address?.state ?? "",
    shipping_pincode: order.address?.pincode ?? "",
    shipping_country: "India",
    shipping_email: "",
    shipping_phone: order.address?.phone ?? "",
    order_items: [
      {
        name: sellerProduct?.name ?? "Product",
        sku: sellerProduct?.sku ?? "N/A",
        units: sellerOrder.quantity,
        selling_price: Number(sellerOrder.unitPrice),
      },
    ],
    payment_method: order.paymentStatus === "paid" ? "Prepaid" : "COD",
    sub_total: Number(sellerOrder.totalPrice),
    length: dims.length,
    breadth: dims.breadth,
    height: dims.height,
    weight: dims.weight,
    pickup_location: pickupLocation,
  };

  step("shiprocketPayload", { payload: createPayload });

  let shipmentId: number, shiprocketOrderId: string, awbCode: string, courierName: string;
  try {
    const createRes = await shiprocketFetch<ShipRocketCreateOrderResponse>("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(createPayload),
    });
    shipmentId = createRes.shipment_id;
    shiprocketOrderId = String(createRes.order_id);
    step("POST /orders/create/adhoc", {
      ok: true,
      order_id: createRes.order_id,
      shipment_id: createRes.shipment_id,
      status: createRes.status,
    });
  } catch (err) {
    step("POST /orders/create/adhoc", { ok: false, error: String(err) });
    return NextResponse.json({ log, final: "FAILED at order creation" });
  }

  let courierId: number;
  try {
    const srvRes = await shiprocketFetch<{ data: { courier_id: number; courier_name: string; freight_charge: number }[] }>(
      `/courier/serviceability/?pickup_postcode=${sellerProfile.pincode}&delivery_postcode=${order.address?.pincode ?? ""}&weight=${dims.weight}&cod=${
        order.paymentMethod === "cod" ? 1 : 0
      }`
    );
    courierId = srvRes.data?.[0]?.courier_id;
    step("GET /courier/serviceability/", {
      ok: true,
      couriers_available: srvRes.data?.length ?? 0,
      cheapest_courier_id: courierId,
      cheapest_courier_name: srvRes.data?.[0]?.courier_name,
    });
    if (!courierId) throw new Error("No couriers available for this pincode combination");
  } catch (err) {
    step("GET /courier/serviceability/", { ok: false, error: String(err) });
    return NextResponse.json({ log, final: "FAILED at serviceability check" });
  }

  try {
    const awbRes = await shiprocketFetch<ShipRocketAssignAwbResponse>("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentId, courier_id: String(courierId) }),
    });
    awbCode = awbRes.awb_code;
    courierName = awbRes.courier_name;
    step("POST /courier/assign/awb", {
      ok: true,
      awb_code: awbCode,
      courier_name: courierName,
    });
  } catch (err) {
    step("POST /courier/assign/awb", { ok: false, error: String(err) });
    return NextResponse.json({ log, final: "FAILED at AWB assignment" });
  }

  let pickupToken: string | undefined;
  try {
    const today = new Date().toISOString().split("T")[0];
    const pickupRes = await shiprocketFetch<ShipRocketPickupResponse>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentId, pickup_date: today, pickup_time: "10:00" }),
    });
    pickupToken = pickupRes.pickup_token_number;
    step("POST /courier/generate/pickup", {
      ok: true,
      pickup_registered: pickupRes.pickup_registered,
      pickup_token: pickupRes.pickup_token_number,
    });
  } catch (err) {
    step("POST /courier/generate/pickup", { ok: false, error: String(err) });
  }

  let labelUrl: string | null = null;
  try {
    const labelRes = await shiprocketFetch<ShipRocketLabelResponse>("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
    labelUrl = labelRes.label_url ?? null;
    step("POST /courier/generate/label", { ok: true, label_url: labelUrl });
  } catch (err) {
    step("POST /courier/generate/label", { ok: false, error: String(err) });
  }

  let invoiceUrl: string | null = null;
  try {
    const invRes = await shiprocketFetch<ShipRocketInvoiceResponse>("/orders/print/invoice", {
      method: "POST",
      body: JSON.stringify({ order_ids: [Number(shiprocketOrderId)] }),
    });
    invoiceUrl = invRes.invoice_url ?? null;
    step("POST /orders/print/invoice", { ok: true, invoice_url: invoiceUrl });
  } catch (err) {
    step("POST /orders/print/invoice", { ok: false, error: String(err) });
  }

  return NextResponse.json({
    log,
    final: "SUCCESS",
    summary: {
      awb: awbCode,
      courier: courierName,
      labelUrl,
      invoiceUrl,
      pickupToken,
      shiprocketOrderId,
      shipmentId,
    },
    note: "ShipRocket calls completed. Order NOT persisted to DB (this is a dry-run test).",
  });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
