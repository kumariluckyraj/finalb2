import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { closePool, query } from "../lib/db";

async function main() {
  const schemaPath = resolve(process.cwd(), "postgres/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await query(schema);
  await closePool();
  process.stdout.write("PostgreSQL schema applied.\n");
}

main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  await closePool();
  process.exit(1);
});
