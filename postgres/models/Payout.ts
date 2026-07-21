import type { TimestampedRecord } from "./common";

export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";

export interface PayoutRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  periodStart: Date;
  periodEnd: Date;
  grossSales: number;
  totalCommission: number;
  totalShippingDeductions: number;
  totalTaxes: number;
  totalRefunds: number;
  netAmount: number;
  status: PayoutStatus;
  payoutProvider: string;
  payoutReference: string | null;
  paidAt: Date | null;
  invoiceUrl: string | null;
  notes: string | null;
}

export interface PayoutTransactionRecord {
  id: string;
  payoutId: string;
  sellerOrderId: string | null;
  type: "sale" | "commission" | "shipping" | "tax" | "refund" | "adjustment";
  amount: number;
  description: string | null;
  createdAt: Date;
}
