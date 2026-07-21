import { readFileSync } from "node:fs";
import { join } from "node:path";
import { query } from "../lib/db";

async function main() {
  const schemaPath = join(__dirname, "..", "seller-schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  console.log("Applying seller schema...");
  await query(sql);
  console.log("Seller schema applied successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to apply seller schema:", err);
  process.exit(1);
});
