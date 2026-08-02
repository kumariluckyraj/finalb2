import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { closePool, getPool } from "../lib/db";

async function main() {
  const schemaPath = resolve(process.cwd(), "postgres/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");

  // IMPORTANT: call pool.query(schema) with NO second argument.
  // The shared `query()` helper defaults `params` to `[]`, and passing any
  // values array (even empty) forces node-postgres onto the extended
  // query protocol, which only allows a single statement per call.
  // schema.sql has many statements separated by `;`, so it needs the
  // simple query protocol — which only kicks in when `values` is
  // genuinely `undefined`.
  await getPool().query(schema);

  await closePool();
  process.stdout.write("PostgreSQL schema applied.\n");
}

main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  await closePool();
  process.exit(1);
});