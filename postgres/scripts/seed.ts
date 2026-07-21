import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { closePool, query } from "../lib/db";

async function applySchema() {
  const schemaPath = resolve(process.cwd(), "postgres/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  await query(schema);
}

async function ensureDefaultCart() {
  await query(`
    INSERT INTO carts (id, scope_key)
    VALUES ($1, 'default')
    ON CONFLICT (scope_key) DO NOTHING
  `, [randomUUID()]);
}

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@b2world.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) {
    process.stdout.write(`Admin user already exists: ${email}\n`);
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), "Admin", email, hashed, "admin"]
  );
  process.stdout.write(`Admin user created: ${email} / ${password}\n`);
}

async function main() {
  await applySchema();
  await ensureDefaultCart();
  await ensureAdminUser();
  await closePool();
  process.stdout.write("PostgreSQL seed completed.\n");
}

main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  await closePool();
  process.exit(1);
});
