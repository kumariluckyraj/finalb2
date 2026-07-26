import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listTeamMembers, createTeamMember, TeamRole } from "@/postgres/repositories/adminTeam";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const members = await listTeamMembers();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { name, email, password, role } = (body || {}) as {
    name?: string; email?: string; password?: string; role?: TeamRole;
  };

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 characters)" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
  }
  if (!role || !["sub_admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "Role must be sub_admin or employee" }, { status: 400 });
  }

  try {
    const member = await createTeamMember({ name, email, password, role, createdBy: user.userId });
    return NextResponse.json({ member }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create team member" }, { status: 409 });
  }
}