export type UserRole = "admin" | "customer" | "vendor";

export type VendorApplicationStatus = "pending" | "approved" | "rejected";

export type PaymentMethod = "razorpay" | "cod";

export type PaymentStatus = "pending" | "paid";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processed"
  | "picked_up"
  | "shipped"
  | "hub"
  | "out_for_delivery"
  | "delivered";

export interface TimestampedRecord {
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAddress {
  fullName: string | null;
  phone: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export interface OrderTrackingEvent {
  id: string;
  status: OrderStatus;
  label: string;
  description: string | null;
  timestamp: Date;
}
