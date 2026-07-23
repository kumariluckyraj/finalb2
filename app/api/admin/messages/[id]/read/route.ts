import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { markMessageReadAsAdmin } from "@/postgres/repositories/sellerMessages";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markMessageReadAsAdmin(params.id);
  return NextResponse.json({ success: true });
}