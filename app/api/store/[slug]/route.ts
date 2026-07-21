import { NextRequest, NextResponse } from "next/server";
import { findStoreBySlug } from "@/postgres/repositories/stores";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { listProductsByVendor } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const store = await findStoreBySlug(slug);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const sellerProfile = await findSellerProfileById(store.sellerId);
  if (!sellerProfile) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const products = await listProductsByVendor(sellerProfile.userId);

  return NextResponse.json({
    store: {
      id: store.id,
      storeName: store.storeName,
      urlSlug: store.urlSlug,
      bannerUrl: store.bannerUrl,
      description: store.description,
      shippingPolicy: store.shippingPolicy,
      returnPolicy: store.returnPolicy,
      rating: store.rating,
      totalRatings: store.totalRatings,
    },
    sellerProfile: {
      id: sellerProfile.id,
      businessName: sellerProfile.businessName,
      businessLogoUrl: sellerProfile.businessLogoUrl,
      city: sellerProfile.city,
      state: sellerProfile.state,
    },
    products: products.map(toApiProduct).filter(Boolean),
    totalProducts: products.length,
  });
}
