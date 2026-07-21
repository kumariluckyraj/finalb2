import { query } from "../lib/db";

export interface SiblingListing {
  sellerProductId: string;
  vendorId: string;
  name: string;
  price: number;
  actualPrice: number;
  discount: number;
  image: string;
  stock: number;
  brand: string | null;
  sellerId: string;
  storeName: string | null;
  storeId: string | null;
  businessName: string;
  sellerCity: string | null;
  sellerState: string | null;
  shipsFrom: string | null;
}

export interface SiblingGroup {
  brand: string | null;
  category: string;
  name: string;
  listings: SiblingListing[];
}

export async function findSiblingProducts(productId: string): Promise<SiblingGroup | null> {
  const { rows: [product] } = await query<{
    id: string;
    name: string;
    category: string;
    brand: string | null;
  }>(`SELECT id, name, category, brand FROM products WHERE id = $1`, [productId]);

  if (!product) return null;

  const brand = product.brand;
  const category = product.category;
  const name = product.name;

  const params: unknown[] = [category, name, productId];
  let brandClause = "";

  if (brand) {
    brandClause = `AND LOWER(p.brand) = LOWER($4)`;
    params.push(brand);
  }

  const { rows } = await query<SiblingListing>(
    `
    SELECT
      p.id                                      AS "sellerProductId",
      p.vendor_id                               AS "vendorId",
      p.name,
      p.price::float8                           AS "price",
      p.actual_price::float8                    AS "actualPrice",
      p.discount::float8                        AS "discount",
      p.image,
      p.stock,
      p.brand,
      sp.seller_id                              AS "sellerId",
      st.store_name                             AS "storeName",
      st.id                                     AS "storeId",
      spr.business_name                         AS "businessName",
      spr.city                                  AS "sellerCity",
      spr.state                                 AS "sellerState",
      sp.ships_from                             AS "shipsFrom"
    FROM products p
    JOIN seller_products sp ON sp.id = p.id
    JOIN seller_profiles spr ON spr.id = sp.seller_id
    LEFT JOIN stores st ON st.seller_id = spr.id
    WHERE LOWER(p.category) = LOWER($1)
      AND LOWER(p.name) = LOWER($2)
      AND p.id != $3
      AND sp.status = 'active'
      ${brandClause}
    ORDER BY p.price ASC
    `,
    params
  );

  return {
    brand: product.brand,
    category: product.category,
    name: product.name,
    listings: rows,
  };
}

export async function isPincodeServiceable(
  sellerProductId: string,
  pincode: string
): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM product_serviceable_pincodes WHERE seller_product_id = $1 AND pincode = $2 LIMIT 1`,
    [sellerProductId, pincode]
  );
  return rows.length > 0;
}

export async function getServiceablePincodes(
  sellerProductId: string
): Promise<string[]> {
  const { rows } = await query<{ pincode: string }>(
    `SELECT pincode FROM product_serviceable_pincodes WHERE seller_product_id = $1`,
    [sellerProductId]
  );
  return rows.map(r => r.pincode);
}
