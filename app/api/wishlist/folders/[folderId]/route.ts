import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { renameFolder, deleteFolder } from "@/postgres/repositories/wishlist";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { folderId } = await params;
  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "List name is required" }, { status: 400 });

  await renameFolder(user.userId, folderId, name);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { folderId } = await params;
  await deleteFolder(user.userId, folderId);
  return NextResponse.json({ success: true });
}