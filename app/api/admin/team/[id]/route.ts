import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { deleteTeamMember } from "@/postgres/repositories/adminTeam";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.userId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await deleteTeamMember(id);
  return NextResponse.json({ success: true });
}