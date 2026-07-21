export interface SellerMessageRecord {
  id: string;
  sellerId: string;
  userId: string | null;
  orderId: string | null;
  broadcastId: string | null;
  subject: string;
  body: string;
  direction: "incoming" | "outgoing";
  senderType: "seller" | "buyer" | "support";
  isRead: boolean;
  createdAt: Date;
}
