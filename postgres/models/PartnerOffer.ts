import type { TimestampedRecord } from "./common";

export interface PartnerOfferRecord extends TimestampedRecord {
  id: string;
  brand: string;
  category: string;
  description: string;
  coinsRequired: number;
  discountValue: string;
  iconUrl: string | null;
  tag: string | null;
  termsUrl: string | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  sortOrder: number;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
}

export interface CreatePartnerOfferInput {
  brand: string;
  category: string;
  description: string;
  coinsRequired: number;
  discountValue: string;
  iconUrl?: string;
  tag?: string;
  termsUrl?: string;
  usageLimit?: number;
  perUserLimit?: number;
  sortOrder?: number;
  startsAt: Date;
  endsAt: Date;
}

export interface PartnerOfferRedemptionRecord extends TimestampedRecord {
  id: string;
  offerId: string;
  userId: string;
  couponCode: string;
  coinsSpent: number;
  status: "active" | "used" | "expired";
  usedAt: Date | null;
}
