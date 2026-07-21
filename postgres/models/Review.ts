import type { TimestampedRecord } from "./common";

export interface ReviewRecord extends TimestampedRecord {
  id: string;
  productId: string | null;
  userId: string | null;
  userName: string | null;
  rating: number | null;
  comment: string | null;
  images: string[];
  video: string | null;
  helpfulCount: number;
  verified: boolean;
}

export interface CreateReviewInput {
  id?: string;
  productId?: string | null;
  userId?: string | null;
  userName?: string | null;
  rating?: number | null;
  comment?: string | null;
  images?: string[];
  video?: string | null;
  verified?: boolean;
}

export interface ReviewFilters {
  rating?: number | null;
  hasMedia?: boolean;
  sort?: "recent" | "highest" | "lowest";
}
