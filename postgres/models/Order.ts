import type { OrderAddress, OrderStatus, OrderTrackingEvent, PaymentMethod, PaymentStatus, TimestampedRecord } from "./common";
import type { ProductRecord } from "./Product";

export interface OrderRecord extends TimestampedRecord {
  id: string;
  userId: string;
  productId: string;
  vendorId: string;
  quantity: number;
  size: string | null;
  address: OrderAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: OrderStatus;
  totalAmount: number;
  trackingEvents: OrderTrackingEvent[];
}

export type OrderWithProductRecord = Omit<OrderRecord, "productId"> & {
  productId: ProductRecord | null;
};

export interface CreateOrderInput {
  id?: string;
  userId: string;
  productId: string;
  vendorId: string;
  quantity?: number;
  size?: string | null;
  address?: Partial<OrderAddress>;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  status?: OrderStatus;
  totalAmount: number;
}

export interface CreateTrackingEventInput {
  id?: string;
  orderId: string;
  status: OrderStatus;
  label: string;
  description?: string | null;
  timestamp?: Date;
}
