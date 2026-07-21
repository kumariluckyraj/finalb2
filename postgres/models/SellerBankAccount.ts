import type { TimestampedRecord } from "./common";

export interface SellerBankAccountRecord extends TimestampedRecord {
  id: string;
  sellerId: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string | null;
  accountType: "savings" | "current";
  isPrimary: boolean;
  verified: boolean;
}

export interface CreateSellerBankAccountInput {
  sellerId: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName?: string | null;
  accountType?: "savings" | "current";
}
