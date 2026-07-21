import type { TimestampedRecord } from "./common";

export interface OTPRecord extends TimestampedRecord {
  id: string;
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

export interface UpsertOTPInput {
  phone: string;
  otp: string;
  expiresAt: Date;
  verified?: boolean;
}
