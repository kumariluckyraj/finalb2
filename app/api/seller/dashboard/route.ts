import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId, createSellerProfile } from "@/postgres/repositories/sellerProfiles";
import { findStoreBySellerId, createStore, findStoreBySlug } from "@/postgres/repositories/stores";
import { getSellerOrderStats } from "@/postgres/repositories/sellerOrders";
import { getSellerPayoutSummary } from "@/postgres/repositories/payouts";
import { countUnreadMessages } from "@/postgres/repositories/sellerMessages";
import { listSellerProducts } from "@/postgres/repositories/sellerProducts";
import { getServiceablePincodes } from "@/postgres/repositories/productRecommendations";
import { findVendorApplicationByEmail } from "@/postgres/repositories/vendorApplications";
import { query } from "@/postgres/lib/db";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "store";
}

async function generateUniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base);
  let candidate = baseSlug;
  let suffix = 1;

  while (await findStoreBySlug(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

        try {
          const uniqueSlug = await generateUniqueSlug(
            app.storeName || user.name || "store"
          );

          await createStore({
            sellerId: profile.id,
            storeName: app.storeName || user.name || "My Store",
            urlSlug: uniqueSlug,
            bannerUrl: app.storeBannerUrl || null,
            description: app.storeDescription || null,
            primaryCategory: app.productCategory || null,
            subcategories: [],
          });
        } catch (storeErr) {
          // Profile was created but store creation failed.
          // Log loudly so this doesn't silently leave an orphaned profile.
          console.error(
            `seller/dashboard: store creation failed for sellerId=${profile.id}`,
            storeErr
          );
          throw storeErr;
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Not a seller" }, { status: 404 });
    }

    const store = await findStoreBySellerId(profile.id);

    const [orderStats, payoutSummary, unreadMessages, lowStockProducts, weeklyRevenueResult, activeProducts] =
      await Promise.all([
        getSellerOrderStats(profile.id),
        getSellerPayoutSummary(profile.id),
        countUnreadMessages(profile.id),
        listSellerProducts(profile.id, { lowStock: true, limit: 5 }),
        query<{ revenue: number }>(
          `
            SELECT COALESCE(SUM(total_price), 0)::float8 AS revenue
            FROM seller_orders
            WHERE seller_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
          `,
          [profile.id]
        ),
        listSellerProducts(profile.id, { status: "active", limit: 500 }),
      ]);

    const lowStockCount = lowStockProducts.length;
    const weeklyRevenue = Number(weeklyRevenueResult.rows[0]?.revenue ?? 0);

    // Batch pincode coverage lookups instead of N sequential queries.
   let pincodeCoverageCount = 0;
    if (activeProducts.length > 0) {
      const productIds = activeProducts.map((p) => p.id);
      const coverageResult = await query<{ seller_product_id: string; pincode_count: number }>(
        `
          SELECT seller_product_id, COUNT(*)::int AS pincode_count
          FROM product_serviceable_pincodes
          WHERE seller_product_id = ANY($1)
          GROUP BY seller_product_id
        `,
        [productIds]
      );
      pincodeCoverageCount = coverageResult.rows.filter((r) => r.pincode_count > 0).length;
    }
    return NextResponse.json({
      profile,
      store,
      orderStats,
      payoutSummary,
      unreadMessages,
      lowStockCount,
      weeklyRevenue,
      pincodeCoverageCount,
      totalActiveProducts: activeProducts.length,
    });
  } catch (err) {
    console.error("seller/dashboard error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}