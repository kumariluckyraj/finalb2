import { NextRequest, NextResponse } from "next/server";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { listProductsByVendor } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function GET(_: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  const sellerId = (await params).sellerId;
  const sellerProfile = await findSellerProfileById(sellerId);
  if (!sellerProfile) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const products = await listProductsByVendor(sellerProfile.userId);

  return NextResponse.json({
    sellerProfile: {
      id: sellerProfile.id,
      userId: sellerProfile.userId,
      businessName: sellerProfile.businessName,
      businessType: sellerProfile.businessType,
      businessLogoUrl: sellerProfile.businessLogoUrl,
      phone: sellerProfile.phone,
      addressLine1: sellerProfile.addressLine1,
      addressLine2: sellerProfile.addressLine2,
      city: sellerProfile.city,
      state: sellerProfile.state,
      pincode: sellerProfile.pincode,
    },
    products: products.map(toApiProduct).filter(Boolean),
    totalProducts: products.length,
  });
}
