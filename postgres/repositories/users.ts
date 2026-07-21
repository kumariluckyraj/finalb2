import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateUserInput, UserRecord } from "../models/User";

const userSelect = `
  SELECT
    id,
    name,
    email,
    phone,
    password,
    role,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM users
`;

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const id = input.id ?? randomUUID();
  const { rows } = await query<UserRecord>(
    `
      INSERT INTO users (id, name, email, phone, password, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, password, role, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, input.name, input.email, input.phone || null, input.password, input.role ?? "customer"]
  );
  return rows[0];
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>(`${userSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>(`${userSelect} WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function listUsers(): Promise<UserRecord[]> {
  const { rows } = await query<UserRecord>(`${userSelect} ORDER BY created_at DESC`);
  return rows;
}

export async function updateUserRole(id: string, role: UserRecord["role"]): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>(
    `
      UPDATE users
      SET role = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, phone, password, role, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, role]
  );
  return rows[0] ?? null;
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>(
    `
      UPDATE users
      SET password = $2, updated_at = now()
      WHERE email = $1
      RETURNING id, name, email, phone, password, role, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [email, passwordHash]
  );
  return rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}
