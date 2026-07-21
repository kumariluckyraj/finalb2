import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId, createSellerProfile } from "@/postgres/repositories/sellerProfiles";
import { findStoreBySellerId, createStore } from "@/postgres/repositories/stores";
import { findBankAccountBySellerId, createBankAccount } from "@/postgres/repositories/sellerBankAccounts";
import { findVendorApplicationByEmail } from "@/postgres/repositories/vendorApplications";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await findSellerProfileByUserId(user.userId);

  // Lazy migration: if profile doesn't exist but user is a vendor, check vendor_applications
  if (!profile && user.role === "vendor") {
    const app = await findVendorApplicationByEmail(user.email);
    if (app && app.status === "approved") {
      profile = await createSellerProfile({
        userId: user.userId,
        businessName: app.storeName || user.name || "My Business",
        businessType: "individual",
        phone: app.mobile || "",
        addressLine1: app.addressLine1 || "",
        addressLine2: app.addressLine2 || null,
        city: app.city || "",
        state: app.state || "",
        pincode: app.pincode || "",
        gstPan: app.gstNumber || app.panNumber || null,
        businessLogoUrl: app.storeLogoUrl || null,
      });

      await createStore({
        sellerId: profile.id,
        storeName: app.storeName || user.name || "My Store",
        urlSlug: (app.storeName || user.name || "store").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        bannerUrl: app.storeBannerUrl || null,
        description: app.storeDescription || null,
        primaryCategory: app.productCategory || null,
        subcategories: [],
      });

      await createBankAccount({
        sellerId: profile.id,
        accountHolderName: app.accountHolderName || "",
        accountNumber: app.accountNumber || "",
        confirmAccountNumber: app.accountNumber || "",
        ifscCode: app.ifscCode || "",
        bankName: null,
        accountType: "savings",
      });
    }
  }

  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const store = await findStoreBySellerId(profile.id);
  const bank = await findBankAccountBySellerId(profile.id);

  return NextResponse.json({ profile, store, bank, user });
}
