import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listSellerProducts } from "@/postgres/repositories/sellerProducts";
import { getServiceablePincodes } from "@/postgres/repositories/productRecommendations";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

    const products = await listSellerProducts(profile.id, { status: "active" });

    const productsWithPincodes = await Promise.all(
      products.map(async (p) => {
        const pincodes = await getServiceablePincodes(p.id);
        return {
          id: p.id,
          name: p.name,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp,
          stock: p.stock,
          status: p.status,
          shipsFrom: p.shipsFrom,
          pincodeCount: pincodes.length,
          pincodes,
        };
      })
    );

    const totalActive = products.length;
    const withPincodes = productsWithPincodes.filter((p) => p.pincodeCount > 0).length;
    const totalPincodeEntries = productsWithPincodes.reduce((sum, p) => sum + p.pincodeCount, 0);

    return NextResponse.json({
      products: productsWithPincodes,
      stats: { totalActive, withPincodes, totalPincodeEntries },
    });
  } catch (err) {
    console.error("seller/pincodes GET error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, pincode } = body as { productId?: string; pincode?: string };
    if (!productId || !pincode) {
      return NextResponse.json({ error: "productId and pincode required" }, { status: 400 });
    }

    // Basic pincode format check (6-digit Indian pincode)
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "pincode must be a 6-digit number" }, { status: 400 });
    }

    const existing = await query(
      `SELECT 1 FROM product_serviceable_pincodes WHERE seller_product_id = $1 AND pincode = $2`,
      [productId, pincode]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Pincode already exists" }, { status: 409 });
    }

    await query(
      `INSERT INTO product_serviceable_pincodes (id, seller_product_id, pincode) VALUES (gen_random_uuid(), $1, $2)`,
      [productId, pincode]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("seller/pincodes POST error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, pincode } = body as { productId?: string; pincode?: string };
    if (!productId || !pincode) {
      return NextResponse.json({ error: "productId and pincode required" }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM product_serviceable_pincodes WHERE seller_product_id = $1 AND pincode = $2`,
      [productId, pincode]
    );

    return NextResponse.json({ success: true, deleted: result.rowCount ?? 0 });
  } catch (err) {
    console.error("seller/pincodes DELETE error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}