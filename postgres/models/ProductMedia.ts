export interface ProductMediaRecord {
  id: string;
  productId: string;
  url: string;
  type: "image" | "video";
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}
