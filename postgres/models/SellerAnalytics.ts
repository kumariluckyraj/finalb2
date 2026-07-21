export interface SellerAnalyticsRecord {
  id: string;
  sellerId: string;
  date: Date;
  revenue: number;
  ordersCount: number;
  visitorsCount: number;
  conversionCount: number;
  topProductId: string | null;
  returnRate: number;
  createdAt: Date;
}
