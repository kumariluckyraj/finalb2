import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { listSellerProducts } from "@/postgres/repositories/sellerProducts";
import {
  getProductCoverage,
  setCoverageType,
  addCoverageArea,
  removeCoverageArea,
  CoverageType,
} from "@/postgres/repositories/productCoverage";

const VALID_TYPES: CoverageType[] = ["PAN", "STATE", "DISTRICT", "PINCODE"];
const VALID_AREA_TYPES = ["STATE", "DISTRICT", "PINCODE"] as const;
type AreaType = (typeof VALID_AREA_TYPES)[number];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await findSellerProfileByUserId(user.userId);
    if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

    const products = await listSellerProducts(profile.id, { status: "active" });

    const productsWithCoverage = await Promise.all(
      products.map(async (p) => {
        const { coverageType, areas } = await getProductCoverage(p.id);
        return {
          id: p.id,
          name: p.name,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp,
          stock: p.stock,
          status: p.status,
          shipsFrom: p.shipsFrom,
          coverageType,
          areas, // [{ id, areaType, value }]
        };
      })
    );

    const totalActive = products.length;
    const withCoverage = productsWithCoverage.filter(
      (p) => p.coverageType === "PAN" || p.areas.length > 0
    ).length;
    const totalAreaEntries = productsWithCoverage.reduce((sum, p) => sum + p.areas.length, 0);

    return NextResponse.json({
      products: productsWithCoverage,
      stats: { totalActive, withCoverage, totalAreaEntries },
    });
  } catch (err) {
    console.error("seller/pincodes GET error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Set a product's coverage mode: PAN / STATE / DISTRICT / PINCODE
export async function PATCH(req: NextRequest) {
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

    const { productId, coverageType } = body as { productId?: string; coverageType?: CoverageType };

    if (!productId || !coverageType || !VALID_TYPES.includes(coverageType)) {
      return NextResponse.json({ error: "productId and valid coverageType required" }, { status: 400 });
    }

    await setCoverageType(productId, coverageType);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("seller/pincodes PATCH error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Add a STATE / DISTRICT / PINCODE value to a product's coverage
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

    const { productId, areaType, value } = body as {
      productId?: string;
      areaType?: AreaType;
      value?: string;
    };

    if (!productId || !areaType || !value) {
      return NextResponse.json({ error: "productId, areaType, value required" }, { status: 400 });
    }
    if (!VALID_AREA_TYPES.includes(areaType)) {
      return NextResponse.json({ error: "areaType must be STATE, DISTRICT, or PINCODE" }, { status: 400 });
    }
    if (areaType === "PINCODE" && !/^\d{6}$/.test(value)) {
      return NextResponse.json({ error: "pincode must be a 6-digit number" }, { status: 400 });
    }
    if ((areaType === "STATE" || areaType === "DISTRICT") && value.trim().length < 2) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    try {
      await addCoverageArea(productId, areaType, value.trim());
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Could not add" }, { status: 409 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("seller/pincodes POST error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Remove a STATE / DISTRICT / PINCODE value from a product's coverage
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

    const { productId, areaType, value } = body as {
      productId?: string;
      areaType?: AreaType;
      value?: string;
    };

    if (!productId || !areaType || !value) {
      return NextResponse.json({ error: "productId, areaType, value required" }, { status: 400 });
    }
    if (!VALID_AREA_TYPES.includes(areaType)) {
      return NextResponse.json({ error: "areaType must be STATE, DISTRICT, or PINCODE" }, { status: 400 });
    }

    await removeCoverageArea(productId, areaType, value);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("seller/pincodes DELETE error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}