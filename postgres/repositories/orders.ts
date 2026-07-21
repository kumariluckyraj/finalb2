import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type {
  CreateOrderInput,
  CreateTrackingEventInput,
  OrderRecord,
  OrderWithProductRecord,
} from "../models/Order";
import type { OrderTrackingEvent } from "../models/common";
import type { ProductRecord } from "../models/Product";

const orderColumns = `
  o.id,
  o.user_id AS "userId",
  o.product_id AS "productId",
  o.vendor_id AS "vendorId",
  o.quantity,
  o.size,
  o.address_full_name AS "addressFullName",
  o.address_phone AS "addressPhone",
  o.address_line1 AS "addressLine1",
  o.address_line2 AS "addressLine2",
  o.address_city AS "addressCity",
  o.address_state AS "addressState",
  o.address_pincode AS "addressPincode",
  o.payment_method AS "paymentMethod",
  o.payment_status AS "paymentStatus",
  o.razorpay_order_id AS "razorpayOrderId",
  o.razorpay_payment_id AS "razorpayPaymentId",
  o.status,
  o.total_amount::float8 AS "totalAmount",
  o.created_at AS "createdAt",
  o.updated_at AS "updatedAt"
`;

const productColumns = `
  p.id AS "product.id",
  p.vendor_id AS "product.vendorId",
  p.name AS "product.name",
  p.description AS "product.description",
  p.category AS "product.category",
  p.actual_price::float8 AS "product.actualPrice",
  p.price::float8 AS "product.price",
  p.discount::float8 AS "product.discount",
  p.image AS "product.image",
  p.stock AS "product.stock",
  p.max_coin_redemption_percent AS "product.maxCoinRedemptionPercent",
  p.weight AS "product.weight",
  p.dimensions AS "product.dimensions",
  p.size AS "product.size",
  p.brand AS "product.brand",
  p.author AS "product.author",
  p.material AS "product.material",
  p.flavor AS "product.flavor",
  p.created_at AS "product.createdAt",
  p.updated_at AS "product.updatedAt"
`;

function hydrateProduct(row: Record<string, unknown>): ProductRecord | null {
  const productId = row["product.id"] as string | undefined;
  if (!productId) return null;
  return {
    id: productId,
    vendorId: row["product.vendorId"] as string,
    name: row["product.name"] as string,
    description: row["product.description"] as string,
    category: row["product.category"] as string,
    actualPrice: Number(row["product.actualPrice"]),
    price: Number(row["product.price"]),
    discount: Number(row["product.discount"]),
    image: row["product.image"] as string,
    stock: row["product.stock"] === null || row["product.stock"] === undefined ? null : Number(row["product.stock"]),
    maxCoinRedemptionPercent: Number(row["product.maxCoinRedemptionPercent"]),
    weight: (row["product.weight"] as string | null) ?? null,
    dimensions: (row["product.dimensions"] as string | null) ?? null,
    size: (row["product.size"] as string | null) ?? null,
    brand: (row["product.brand"] as string | null) ?? null,
    author: (row["product.author"] as string | null) ?? null,
    material: (row["product.material"] as string | null) ?? null,
    flavor: (row["product.flavor"] as string | null) ?? null,
    createdAt: row["product.createdAt"] as Date,
    updatedAt: row["product.updatedAt"] as Date,
  };
}

async function fetchTrackingEvents(orderIds: string[]): Promise<Map<string, OrderTrackingEvent[]>> {
  const result = new Map<string, OrderTrackingEvent[]>();
  if (orderIds.length === 0) return result;

  const { rows } = await query<OrderTrackingEvent & { orderId: string }>(
    `
      SELECT
        id,
        order_id AS "orderId",
        status,
        label,
        description,
        timestamp
      FROM order_tracking_events
      WHERE order_id = ANY($1::text[])
      ORDER BY timestamp ASC
    `,
    [orderIds]
  );

  for (const row of rows) {
    const existing = result.get(row.orderId) ?? [];
    existing.push({
      id: row.id,
      status: row.status,
      label: row.label,
      description: row.description ?? null,
      timestamp: row.timestamp,
    });
    result.set(row.orderId, existing);
  }

  return result;
}

function mapOrder(row: Record<string, unknown>, trackingEvents: OrderTrackingEvent[] = []): OrderRecord {
  return {
    id: row.id as string,
    userId: row.userId as string,
    productId: row.productId as string,
    vendorId: row.vendorId as string,
    quantity: Number(row.quantity),
    size: (row.size as string | null) ?? null,
    address: {
      fullName: (row.addressFullName as string | null) ?? null,
      phone: (row.addressPhone as string | null) ?? null,
      line1: (row.addressLine1 as string | null) ?? null,
      line2: (row.addressLine2 as string | null) ?? null,
      city: (row.addressCity as string | null) ?? null,
      state: (row.addressState as string | null) ?? null,
      pincode: (row.addressPincode as string | null) ?? null,
    },
    paymentMethod: row.paymentMethod as OrderRecord["paymentMethod"],
    paymentStatus: row.paymentStatus as OrderRecord["paymentStatus"],
    razorpayOrderId: (row.razorpayOrderId as string | null) ?? null,
    razorpayPaymentId: (row.razorpayPaymentId as string | null) ?? null,
    status: row.status as OrderRecord["status"],
    totalAmount: Number(row.totalAmount),
    trackingEvents,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const id = input.id ?? randomUUID();
  const address = input.address ?? {};
  const { rows } = await query<Record<string, unknown>>(
    `
      INSERT INTO orders (
        id, user_id, product_id, vendor_id, quantity, address_full_name, address_phone,
        size, address_line1, address_line2, address_city, address_state, address_pincode,
        payment_method, payment_status, razorpay_order_id, razorpay_payment_id, status, total_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, user_id AS "userId", product_id AS "productId", vendor_id AS "vendorId", quantity, size, address_full_name AS "addressFullName", address_phone AS "addressPhone", address_line1 AS "addressLine1", address_line2 AS "addressLine2", address_city AS "addressCity", address_state AS "addressState", address_pincode AS "addressPincode", payment_method AS "paymentMethod", payment_status AS "paymentStatus", razorpay_order_id AS "razorpayOrderId", razorpay_payment_id AS "razorpayPaymentId", status, total_amount::float8 AS "totalAmount", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      input.userId,
      input.productId,
      input.vendorId,
      input.quantity ?? 1,
      address.fullName ?? null,
      address.phone ?? null,
      input.size ?? null,
      address.line1 ?? null,
      address.line2 ?? null,
      address.city ?? null,
      address.state ?? null,
      address.pincode ?? null,
      input.paymentMethod ?? "cod",
      input.paymentStatus ?? "pending",
      input.razorpayOrderId ?? null,
      input.razorpayPaymentId ?? null,
      input.status ?? "pending",
      input.totalAmount,
    ]
  );
  return mapOrder(rows[0], []);
}

export async function listOrdersByUserId(userId: string): Promise<OrderWithProductRecord[]> {
  const { rows } = await query<Record<string, unknown>>(
    `
        SELECT
          ${orderColumns},
          ${productColumns}
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `,
    [userId]
  );
  const tracking = await fetchTrackingEvents(rows.map((row: Record<string, unknown>) => row.id as string));
  return rows.map((row: Record<string, unknown>) => ({
    ...mapOrder(row, tracking.get(row.id as string) ?? []),
    productId: hydrateProduct(row),
  }));
}

export async function listAllOrders(): Promise<OrderWithProductRecord[]> {
  const { rows } = await query<Record<string, unknown>>(
    `
        SELECT
          ${orderColumns},
          ${productColumns}
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        ORDER BY o.created_at DESC
    `
  );
  const tracking = await fetchTrackingEvents(rows.map((row: Record<string, unknown>) => row.id as string));
  return rows.map((row: Record<string, unknown>) => ({
    ...mapOrder(row, tracking.get(row.id as string) ?? []),
    productId: hydrateProduct(row),
  }));
}

export async function findOrderById(id: string): Promise<OrderWithProductRecord | null> {
  const { rows } = await query<Record<string, unknown>>(
    `
      SELECT
        ${orderColumns},
        ${productColumns}
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.id = $1
    `,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  const tracking = await fetchTrackingEvents([id]);
  return {
    ...mapOrder(row, tracking.get(id) ?? []),
    productId: hydrateProduct(row),
  };
}

export async function updatePaymentDetails(orderId: string, razorpayPaymentId: string): Promise<OrderRecord | null> {
  const { rows } = await query<Record<string, unknown>>(
    `
      UPDATE orders
      SET razorpay_payment_id = $2, payment_status = 'paid', updated_at = now()
      WHERE id = $1
      RETURNING id, user_id AS "userId", product_id AS "productId", vendor_id AS "vendorId", quantity, size, address_full_name AS "addressFullName", address_phone AS "addressPhone", address_line1 AS "addressLine1", address_line2 AS "addressLine2", address_city AS "addressCity", address_state AS "addressState", address_pincode AS "addressPincode", payment_method AS "paymentMethod", payment_status AS "paymentStatus", razorpay_order_id AS "razorpayOrderId", razorpay_payment_id AS "razorpayPaymentId", status, total_amount::float8 AS "totalAmount", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [orderId, razorpayPaymentId]
  );
  return rows[0] ? mapOrder(rows[0], []) : null;
}

export async function updateOrderStatus(orderId: string, status: OrderRecord["status"]): Promise<OrderRecord | null> {
  const { rows } = await query<Record<string, unknown>>(
    `
      UPDATE orders
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, user_id AS "userId", product_id AS "productId", vendor_id AS "vendorId", quantity, size, address_full_name AS "addressFullName", address_phone AS "addressPhone", address_line1 AS "addressLine1", address_line2 AS "addressLine2", address_city AS "addressCity", address_state AS "addressState", address_pincode AS "addressPincode", payment_method AS "paymentMethod", payment_status AS "paymentStatus", razorpay_order_id AS "razorpayOrderId", razorpay_payment_id AS "razorpayPaymentId", status, total_amount::float8 AS "totalAmount", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [orderId, status]
  );
  return rows[0] ? mapOrder(rows[0], []) : null;
}

export async function appendTrackingEvent(input: CreateTrackingEventInput): Promise<OrderTrackingEvent> {
  const { rows } = await query<OrderTrackingEvent>(
    `
      INSERT INTO order_tracking_events (id, order_id, status, label, description, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, status, label, description, timestamp
    `,
    [input.id ?? randomUUID(), input.orderId, input.status, input.label, input.description ?? null, input.timestamp ?? new Date()]
  );
  return rows[0];
}

export async function updateOrderStatusWithTracking(
  orderId: string,
  status: OrderRecord["status"],
  label: string,
  description?: string | null
): Promise<OrderWithProductRecord | null> {
  await query(
    `
      UPDATE orders
      SET status = $2, updated_at = now()
      WHERE id = $1
    `,
    [orderId, status]
  );
  await query(
    `
      INSERT INTO order_tracking_events (id, order_id, status, label, description, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [randomUUID(), orderId, status, label, description ?? null, new Date()]
  );

  const { rows } = await query<Record<string, unknown>>(
    `
      SELECT
        ${orderColumns},
        ${productColumns}
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.id = $1
    `,
    [orderId]
  );
  const row = rows[0];
  if (!row) return null;
  const tracking = await fetchTrackingEvents([orderId]);
  return {
    ...mapOrder(row, tracking.get(orderId) ?? []),
    productId: hydrateProduct(row),
  };
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM orders WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function getOrderStats(userId: string): Promise<{ totalOrders: number; totalSpent: number }> {
  const { rows } = await query<{ totalOrders: number; totalSpent: number }>(
    `SELECT
      COUNT(*)::int AS "totalOrders",
      COALESCE(SUM(total_amount), 0) AS "totalSpent"
     FROM orders
     WHERE user_id = $1 AND status = 'delivered'`,
    [userId]
  );
  return rows[0] ?? { totalOrders: 0, totalSpent: 0 };
}

export async function getUserTotalSpent(userId: string): Promise<number> {
  const { rows } = await query<{ total: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) AS total
     FROM orders WHERE user_id = $1 AND status = 'delivered'`,
    [userId]
  );
  return rows[0]?.total ?? 0;
}
