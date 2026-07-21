import { shiprocketFetch } from "./client";
import { findOrderById } from "@/postgres/repositories/orders";
import { findSellerOrderByOrderId } from "@/postgres/repositories/sellerOrders";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { findSellerProductById } from "@/postgres/repositories/sellerProducts";
import { updateSellerOrderShiprocketTracking } from "@/postgres/repositories/sellerOrders";
import type {
  ShipRocketCreateOrderPayload,
  ShipRocketCreateOrderResponse,
  ShipRocketAssignAwbResponse,
  ShipRocketPickupResponse,
  ShipRocketLabelResponse,
  ShipRocketInvoiceResponse,
  ShipRocketTrackingResponse,
} from "./types";

export interface FulfillmentResult {
  sellerOrderId: string;
  success: boolean;
  error?: string;
  awb?: string;
  courierName?: string;
  trackingNumber?: string;
}

function getDefaultDimensions(): { length: number; breadth: number; height: number; weight: number } {
  return { length: 10, breadth: 10, height: 10, weight: 0.5 };
}

export async function fulfillSellerOrders(orderId: string): Promise<FulfillmentResult[]> {
  const order = await findOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  const sellerOrder = await findSellerOrderByOrderId(orderId);
  if (!sellerOrder) throw new Error(`No seller order found for order ${orderId}`);

  const sellerProfile = await findSellerProfileById(sellerOrder.sellerId);
  if (!sellerProfile) throw new Error(`Seller profile not found for seller ${sellerOrder.sellerId}`);

  const sellerProduct = sellerOrder.productId
    ? await findSellerProductById(sellerOrder.productId)
    : null;

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
  const nameParts = customerName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? customerName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  const createPayload: ShipRocketCreateOrderPayload = {
    order_id: `B2W-${orderId.slice(0, 8)}-${sellerOrder.id.slice(0, 4)}`,
    order_date: new Date().toISOString().split("T")[0],
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: order.address?.line1 ?? "",
    billing_address_2: order.address?.line2 ?? "",
    billing_city: order.address?.city ?? "",
    billing_state: order.address?.state ?? "",
    billing_pincode: order.address?.pincode ?? "",
    billing_country: "India",
    billing_email: "noreply@b2world.com",
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
    shipping_email: "noreply@b2world.com",
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

  try {
    const createRes = await shiprocketFetch<ShipRocketCreateOrderResponse>("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(createPayload),
    });

    const shipmentId = createRes.shipment_id;
    const shiprocketOrderId = String(createRes.order_id);

    const serviceabilityRes = await shiprocketFetch<{ data: { courier_id: number }[] }>(
      `/courier/serviceability/?pickup_postcode=${sellerProfile.pincode}&delivery_postcode=${order.address?.pincode ?? ""}&weight=${dims.weight}&cod=${
        order.paymentMethod === "cod" ? 1 : 0
      }`
    );

    const courierId = serviceabilityRes.data?.[0]?.courier_id;
    if (!courierId) throw new Error("No courier available for this pincode");

    const awbRes = await shiprocketFetch<ShipRocketAssignAwbResponse>("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: String(courierId),
      }),
    });

    const awbCode = awbRes.awb_code;
    const courierName = awbRes.courier_name;

    const today = new Date().toISOString().split("T")[0];
    await shiprocketFetch<ShipRocketPickupResponse>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: shipmentId,
        pickup_date: today,
        pickup_time: "10:00",
      }),
    });

    let labelUrl: string | null = null;
    try {
      const labelRes = await shiprocketFetch<ShipRocketLabelResponse>("/courier/generate/label", {
        method: "POST",
        body: JSON.stringify({ shipment_id: shipmentId }),
      });
      labelUrl = labelRes.label_url ?? null;
    } catch {
      console.warn(`Label generation failed for shipment ${shipmentId}`);
    }

    let invoiceUrl: string | null = null;
    try {
      const invoiceRes = await shiprocketFetch<ShipRocketInvoiceResponse>("/orders/print/invoice", {
        method: "POST",
        body: JSON.stringify({ order_ids: [createRes.order_id] }),
      });
      invoiceUrl = invoiceRes.invoice_url ?? null;
    } catch {
      console.warn(`Invoice generation failed for order ${shiprocketOrderId}`);
    }

    await updateSellerOrderShiprocketTracking(sellerOrder.id, {
      trackingNumber: awbCode,
      trackingCompany: courierName,
      shippingLabelUrl: labelUrl,
      invoiceUrl,
      shiprocketOrderId,
      shiprocketShipmentId: String(shipmentId),
    });

    return [
      {
        sellerOrderId: sellerOrder.id,
        success: true,
        awb: awbCode,
        courierName,
        trackingNumber: awbCode,
      },
    ];
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ShipRocket error";
    return [
      {
        sellerOrderId: sellerOrder.id,
        success: false,
        error: message,
      },
    ];
  }
}

export async function trackShipment(awb: string): Promise<ShipRocketTrackingResponse> {
  return shiprocketFetch<ShipRocketTrackingResponse>(`/courier/track/awb/${awb}`);
}

export async function checkServiceability(
  deliveryPincode: string,
  pickupPincode: string,
  weight: number,
  cod: boolean
): Promise<{ courier_id: number; courier_name: string; freight_charge: number }[]> {
  const res = await shiprocketFetch<{ data: { courier_id: number; courier_name: string; freight_charge: number }[] }>(
    `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod ? 1 : 0}`
  );
  return res.data ?? [];
}
