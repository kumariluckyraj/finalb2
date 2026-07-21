import type { TimestampedRecord } from "./common";

export type SellerOrderStatus = "new" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";

export interface SellerOrderRecord extends TimestampedRecord {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  shippingCharge: number;
  taxAmount: number;
  netAmount: number;
  status: SellerOrderStatus;
  trackingNumber: string | null;
  trackingCompany: string | null;
  shippingLabelUrl: string | null;
  invoiceUrl: string | null;
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  buyerNote: string | null;
  sellerNote: string | null;
  isIssueRaised: boolean;
  issueReason: string | null;
}

export interface CreateSellerOrderInput {
  orderId: string;
  sellerId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commissionPercent?: number;
  commissionAmount?: number;
  shippingCharge?: number;
  taxAmount?: number;
  netAmount?: number;
  status?: SellerOrderStatus;
}
