import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId, createSellerProfile } from "@/postgres/repositories/sellerProfiles";
import { findStoreBySellerId, createStore } from "@/postgres/repositories/stores";
import { findBankAccountBySellerId, createBankAccount } from "@/postgres/repositories/sellerBankAccounts";
import { getSellerOrderStats } from "@/postgres/repositories/sellerOrders";
import { getSellerPayoutSummary } from "@/postgres/repositories/payouts";
import { countUnreadMessages } from "@/postgres/repositories/sellerMessages";
import { listSellerProducts } from "@/postgres/repositories/sellerProducts";
import { getServiceablePincodes } from "@/postgres/repositories/productRecommendations";
import { findVendorApplicationByEmail } from "@/postgres/repositories/vendorApplications";
import { query } from "@/postgres/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = await findSellerProfileByUserId(user.userId);

  if (!profile && user.role === "vendor") {
    const app = await findVendorApplicationByEmail(user.email);
    if (app && app.status === "approved") {
      profile = await createSellerProfile({
        userId: user.userId,
        businessName: app.storeName || user.name || "My Business",
        businessType: "individual" as const,
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
    }
  }

  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const store = await findStoreBySellerId(profile.id);
  const orderStats = await getSellerOrderStats(profile.id);
  const payoutSummary = await getSellerPayoutSummary(profile.id);
  const unreadMessages = await countUnreadMessages(profile.id);

  const lowStockProducts = await listSellerProducts(profile.id, { lowStock: true, limit: 5 });
  const lowStockCount = lowStockProducts.length;

  const weeklyRevenue = await query<Record<string, unknown>>(
    `
      SELECT COALESCE(SUM(total_price), 0)::float8 AS revenue
      FROM seller_orders
      WHERE seller_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
    `,
    [profile.id]
  );

  const activeProducts = await listSellerProducts(profile.id, { status: "active", limit: 500 });
  let pincodeCoverageCount = 0;
  for (const p of activeProducts) {
    const pc = await getServiceablePincodes(p.id);
    if (pc.length > 0) pincodeCoverageCount++;
  }

  return NextResponse.json({
    profile,
    store,
    orderStats,
    payoutSummary,
    unreadMessages,
    lowStockCount,
    weeklyRevenue: Number(weeklyRevenue.rows[0]?.revenue ?? 0),
    pincodeCoverageCount,
    totalActiveProducts: activeProducts.length,
  });
}
