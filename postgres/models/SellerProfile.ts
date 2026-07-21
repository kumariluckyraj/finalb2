import type { TimestampedRecord } from "./common";

export type BusinessType = "individual" | "company" | "brand";
export type SellerStatus = "active" | "suspended" | "deactivated";

export interface SellerProfileRecord extends TimestampedRecord {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  gstPan: string | null;
  businessLogoUrl: string | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  status: SellerStatus;
  kycStatus: "pending" | "verified" | "rejected";
  kycMethod: "manual" | "digilocker";
  panNumber: string | null;
  gstNumber: string | null;
  kycVerifiedAt: Date | null;
}

export interface CreateSellerProfileInput {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  gstPan?: string | null;
  businessLogoUrl?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
}
