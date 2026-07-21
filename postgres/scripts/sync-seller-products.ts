import { query } from "../lib/db";

async function main() {
  console.log("Syncing active seller_products to products table...");

  const { rows: products } = await query<any>(`
    SELECT
      sp.id,
      sp.seller_id,
      sp.name,
      sp.description,
      sp.category,
      sp.mrp,
      sp.selling_price,
      sp.discount,
      sp.stock,
      sp.brand,
      sp.created_at,
      sp.updated_at,
      sp.status,
      COALESCE(
        (SELECT url FROM product_media WHERE product_id = sp.id AND is_primary = true LIMIT 1),
        (SELECT url FROM product_media WHERE product_id = sp.id LIMIT 1)
      ) AS image,
      (SELECT user_id FROM seller_profiles WHERE id = sp.seller_id) AS user_id
    FROM seller_products sp
    WHERE sp.status = 'active'
  `);

  let synced = 0;
  for (const p of products) {
    const image = p.image || "";
    await query(
      `
        INSERT INTO products (id, vendor_id, name, description, category, actual_price, price, discount, image, stock, brand, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          vendor_id = EXCLUDED.vendor_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          actual_price = EXCLUDED.actual_price,
          price = EXCLUDED.price,
          discount = EXCLUDED.discount,
          image = EXCLUDED.image,
          stock = EXCLUDED.stock,
          brand = EXCLUDED.brand,
          updated_at = now()
      `,
      [p.id, p.user_id, p.name, p.description, p.category, p.mrp, p.selling_price, p.discount, image, p.stock, p.brand, p.created_at, p.updated_at]
    );
    synced++;
  }

  console.log(`Done. Synced ${synced} active seller products to the products table.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
