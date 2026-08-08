import { NextRequest, NextResponse } from "next/server";
import { findProductById } from "@/postgres/repositories/products";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { findStoreBySellerId } from "@/postgres/repositories/stores";
import { listMediaByProduct } from "@/postgres/repositories/productMedia";
import { findSellerProductById } from "@/postgres/repositories/sellerProducts";
import { toApiProduct } from "@/lib/apiTransform";
import { query } from "@/postgres/lib/db";
import type { SellerProfileRecord } from "@/postgres/models/SellerProfile";
import type { StoreRecord } from "@/postgres/models/Store";

interface ShipsFrom {
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await findProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let sellerProfile: SellerProfileRecord | null = null;
  let store: StoreRecord | null = null;
  let shipsFrom: ShipsFrom | null = null;

  if (product.vendorId) {
    sellerProfile = await findSellerProfileByUserId(product.vendorId);
    if (sellerProfile) {
      store = await findStoreBySellerId(sellerProfile.id);
    }
  }

 const coinConfig = await query<{
    coinValidityDays: number | null;
    maxCoinRedemptionPercent: number | null;
  }>(
    `SELECT coin_validity_days AS "coinValidityDays",
            max_coin_redemption_percent::float8 AS "maxCoinRedemptionPercent"
     FROM products WHERE id = $1`,
    [id]
  );
  const coinConfigRow = coinConfig.rows[0] ?? { coinValidityDays: null, maxCoinRedemptionPercent: null };

  const sp = await query<{
    warehouseAddress: string | null;
    warehouseCity: string | null;
    warehouseState: string | null;
    warehousePincode: string | null;
  }>(
    `SELECT
      warehouse_address AS "warehouseAddress",
      warehouse_city AS "warehouseCity",
      warehouse_state AS "warehouseState",
      warehouse_pincode AS "warehousePincode"
     FROM seller_products WHERE id = $1`,
    [id]
  );

  if (sp.rows.length > 0) {
    const row = sp.rows[0];
    if (row.warehouseCity || row.warehouseAddress) {
      shipsFrom = {
        address: row.warehouseAddress,
        city: row.warehouseCity,
        state: row.warehouseState,
        pincode: row.warehousePincode,
      };
    }
  }

  const media = await listMediaByProduct(id);

 return NextResponse.json({
    product: {
      ...toApiProduct(product),
      // Vendor-configurable coin settings — null means "use platform defaults" (resolved client/server-side).
      coinValidityDays: coinConfigRow.coinValidityDays,
      maxCoinRedemptionPercent: coinConfigRow.maxCoinRedemptionPercent,
      media: media.map(m => ({ id: m.id, url: m.url, type: m.type, isPrimary: m.isPrimary, sortOrder: m.sortOrder })),
      shipsFrom,
      sellerProfile: sellerProfile
        ? {
            id: sellerProfile.id,
            businessName: sellerProfile.businessName,
            businessLogoUrl: sellerProfile.businessLogoUrl,
            phone: sellerProfile.phone,
            city: sellerProfile.city,
            state: sellerProfile.state,
          }
        : null,
     store: store
        ? {
            id: store.id,
            storeName: store.storeName,
            urlSlug: store.urlSlug,
            bannerUrl: store.bannerUrl,
            description: store.description,
            codEnabled: store.codEnabled,
            deliveryPromiseDays: store.deliveryPromiseDays,
            deliveryCharge: store.deliveryCharge,
            freeShippingThreshold: store.freeShippingThreshold,
          }
        : null,
    },
  });
}