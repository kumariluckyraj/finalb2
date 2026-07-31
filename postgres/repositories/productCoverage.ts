import { query } from "@/postgres/lib/db";

export type CoverageType = "PAN" | "STATE" | "DISTRICT" | "PINCODE";
type AreaType = Exclude<CoverageType, "PAN">;

export interface CoverageArea {
  id: string;
  areaType: AreaType;
  value: string;
}

interface CoverageTypeRow {
  coverage_type: CoverageType;
}

interface AreaRow {
  id: string;
  area_type: AreaType;
  value: string;
}

interface PincodeLocationRow {
  state: string;
  district: string;
}

export async function getProductCoverage(productId: string): Promise<{
  coverageType: CoverageType;
  areas: CoverageArea[];
}> {
  const productRes = await query<CoverageTypeRow>(
    `SELECT coverage_type FROM seller_products WHERE id = $1`,
    [productId]
  );
  const coverageType: CoverageType = productRes.rows[0]?.coverage_type || "PINCODE";

  const areasRes = await query<AreaRow>(
    `SELECT id, area_type, value FROM product_coverage_areas WHERE seller_product_id = $1 ORDER BY value`,
    [productId]
  );

  return {
    coverageType,
    areas: areasRes.rows.map((r) => ({
      id: r.id,
      areaType: r.area_type,
      value: r.value,
    })),
  };
}

export async function setCoverageType(productId: string, coverageType: CoverageType) {
  await query(
    `UPDATE seller_products SET coverage_type = $2 WHERE id = $1`,
    [productId, coverageType]
  );
}

export async function addCoverageArea(productId: string, areaType: AreaType, value: string) {
  const existing = await query(
    `SELECT 1 FROM product_coverage_areas WHERE seller_product_id = $1 AND area_type = $2 AND value = $3`,
    [productId, areaType, value]
  );
  if (existing.rows.length > 0) {
    throw new Error("Area already exists");
  }

  await query(
    `INSERT INTO product_coverage_areas (id, seller_product_id, area_type, value)
     VALUES (gen_random_uuid()::text, $1, $2, $3)`,
    [productId, areaType, value]
  );
}

export async function removeCoverageArea(productId: string, areaType: AreaType, value: string) {
  await query(
    `DELETE FROM product_coverage_areas WHERE seller_product_id = $1 AND area_type = $2 AND value = $3`,
    [productId, areaType, value]
  );
}

/** Resolves a pincode to {state, district}, caching results in Postgres. */
export async function resolvePincodeLocation(
  pincode: string
): Promise<{ state: string; district: string } | null> {
  const cached = await query<PincodeLocationRow>(
    `SELECT state, district FROM pincode_lookup_cache WHERE pincode = $1`,
    [pincode]
  );
  if (cached.rows.length > 0) return cached.rows[0];

  try {
   const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
  signal: AbortSignal.timeout(3000), // fail fast instead of hanging
});
    const data = await res.json();
    const po = data?.[0]?.PostOffice?.[0];
    if (!po) return null;

    const state: string = po.State;
    const district: string = po.District;

    await query(
      `INSERT INTO pincode_lookup_cache (pincode, state, district) VALUES ($1, $2, $3)
       ON CONFLICT (pincode) DO UPDATE SET state = $2, district = $3`,
      [pincode, state, district]
    );
    return { state, district };
  } catch (err) {
    console.error("resolvePincodeLocation error:", err);
    return null;
  }
}

/** Buyer-facing check: is `buyerPincode` served by this product? */
export async function isPincodeServiceable(productId: string, buyerPincode: string): Promise<boolean> {
  const { coverageType, areas } = await getProductCoverage(productId);
  if (coverageType === "PAN") return true;

  if (coverageType === "PINCODE") {
    return areas.some((a) => a.areaType === "PINCODE" && a.value === buyerPincode);
  }

  const loc = await resolvePincodeLocation(buyerPincode);
  if (!loc) return false;

  if (coverageType === "STATE") {
    return areas.some((a) => a.areaType === "STATE" && a.value.toLowerCase() === loc.state.toLowerCase());
  }
  if (coverageType === "DISTRICT") {
    return areas.some((a) => a.areaType === "DISTRICT" && a.value.toLowerCase() === loc.district.toLowerCase());
  }
  return false;
}