import type { CartItemWithProductRecord, CartWithItemsRecord } from "@/postgres/models/Cart";
import type { OrderRecord, OrderWithProductRecord } from "@/postgres/models/Order";
import type { ProductRecord } from "@/postgres/models/Product";
import type { ReviewRecord } from "@/postgres/models/Review";
import type { VendorApplicationRecord } from "@/postgres/models/VendorApplication";

export function toApiProduct(product: ProductRecord | null) {
  return product ? { ...product, _id: product.id } : null;
}

type FlatOrderRow = {
  id: string;
  userId: string;
  productId: string | ProductRecord | null;
  vendorId: string;
  quantity: number;
  size?: string | null;
  addressFullName?: string | null;
  addressPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPincode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  status: string;
  totalAmount: number;
  deliveryFee?: number;        // ← add this
  coinsUsed?: number | null;    // ← add if you want it typed too
  coinDiscount?: number | null; // ← same
  trackingEvents?: OrderRecord["trackingEvents"];
  createdAt?: Date;
  updatedAt?: Date;
};
export function toApiOrder(order: OrderRecord | OrderWithProductRecord | FlatOrderRow) {
  if ("addressFullName" in order) {
    const productId = typeof order.productId === "string" || order.productId === null ? order.productId : toApiProduct(order.productId);
    return {
      ...order,
      _id: order.id,
      productId,
      address: {
        fullName: order.addressFullName ?? null,
        phone: order.addressPhone ?? null,
        line1: order.addressLine1 ?? null,
        line2: order.addressLine2 ?? null,
        city: order.addressCity ?? null,
        state: order.addressState ?? null,
        pincode: order.addressPincode ?? null,
      },
    };
  }

  return {
    ...order,
    _id: order.id,
    productId: typeof order.productId === "string" ? order.productId : toApiProduct(order.productId),
  };
}

export function toApiCartItem(item: CartItemWithProductRecord) {
  return {
    ...item,
    _id: item.id,
    productId: toApiProduct(item.productId),
  };
}

export function toApiCart(cart: CartWithItemsRecord) {
  return {
    ...cart,
    _id: cart.id,
    items: cart.items.map(toApiCartItem),
  };
}

export function toApiVendorApplication(application: VendorApplicationRecord) {
  return { ...application, _id: application.id };
}

export function toApiReview(review: ReviewRecord) {
  return { ...review, _id: review.id };
}
