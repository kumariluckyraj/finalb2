import type { TimestampedRecord } from "./common";

export interface BroadcastRecord extends TimestampedRecord {
  id: string;
  adminId: string;
  subject: string;
  body: string;
  targetSellerCount: number;
  sentCount: number;
}
