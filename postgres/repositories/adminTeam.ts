import bcrypt from "bcryptjs";
import { query } from "@/postgres/lib/db";

export type TeamRole = "sub_admin" | "employee";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  createdBy: string | null;
  createdAt: string;
}

interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  created_by: string | null;
  created_at: string;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const { rows } = await query<TeamMemberRow>(
    `SELECT id, name, email, role, created_by, created_at
     FROM users
     WHERE role IN ('sub_admin', 'employee')
     ORDER BY created_at DESC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }));
}

export async function createTeamMember(params: {
  name: string;
  email: string;
  password: string;
  role: TeamRole;
  createdBy: string;
}): Promise<TeamMember> {
  const existing = await query(`SELECT 1 FROM users WHERE email = $1`, [params.email]);
  if (existing.rows.length > 0) {
    throw new Error("Email already exists");
  }

  const hashed = await bcrypt.hash(params.password, 10);

  const { rows } = await query<TeamMemberRow>(
    `INSERT INTO users (id, name, email, password, role, created_by)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_by, created_at`,
    [params.name, params.email, hashed, params.role, params.createdBy]
  );

  const r = rows[0];
  return { id: r.id, name: r.name, email: r.email, role: r.role, createdBy: r.created_by, createdAt: r.created_at };
}

export async function deleteTeamMember(id: string): Promise<void> {
  await query(`DELETE FROM users WHERE id = $1 AND role IN ('sub_admin', 'employee')`, [id]);
}