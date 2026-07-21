import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listUsers, deleteUser } from "@/postgres/repositories/users";
import { query } from "@/postgres/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await listUsers();

  const { rows: orderCounts } = await query<{ user_id: string; count: string }>(
    `SELECT user_id, COUNT(*)::text AS count FROM orders GROUP BY user_id`
  );
  const countMap = new Map(orderCounts.map((r) => [r.user_id, r.count]));

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      role: u.role,
      orderCount: countMap.get(u.id) ?? "0",
      createdAt: u.createdAt,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const ok = await deleteUser(id);
  return NextResponse.json({ success: ok });
}
