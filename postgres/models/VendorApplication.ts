import type { TimestampedRecord, VendorApplicationStatus } from "./common";

export interface VendorApplicationRecord extends TimestampedRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  gstNumber: string;
  panNumber: string;
  aadhaarCardUrl: string;
  gstCertificateUrl: string;
  panCardUrl: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  storeName: string;
  storeDescription: string | null;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
  productCategory: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  status: VendorApplicationStatus;
  userId: string | null;
}

export interface CreateVendorApplicationInput {
  id?: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  gstNumber: string;
  panNumber: string;
  aadhaarCardUrl: string;
  gstCertificateUrl: string;
  panCardUrl: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  storeName: string;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  storeBannerUrl?: string | null;
  productCategory: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  status?: VendorApplicationStatus;
  userId?: string | null;
}
