import type { TimestampedRecord } from "./common";

export interface ProductRecord extends TimestampedRecord {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  actualPrice: number;
  price: number;
  discount: number;
  image: string;
  stock: number | null;
  maxCoinRedemptionPercent: number;
  weight: string | null;
  dimensions: string | null;
  size: string | null;
  brand: string | null;
  author: string | null;
  material: string | null;
  flavor: string | null;
}

export interface CreateProductInput {
  id?: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  actualPrice: number;
  price: number;
  discount: number;
  image: string;
  stock?: number | null;
  maxCoinRedemptionPercent?: number;
  weight?: string | null;
  dimensions?: string | null;
  size?: string | null;
  brand?: string | null;
  author?: string | null;
  material?: string | null;
  flavor?: string | null;
}
