import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserFolders, createFolder } from "@/postgres/repositories/wishlist";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ folders: [] });
  const folders = await getUserFolders(user.userId);
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "List name is required" }, { status: 400 });

  const folder = await createFolder(user.userId, name);
  return NextResponse.json({ folder }, { status: 201 });
}