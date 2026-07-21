import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listAllReturnRequests, findReturnRequestById, addAdminNote } from "@/postgres/repositories/returnRequests";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const returns = await listAllReturnRequests();
  return NextResponse.json({ returns });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, adminNote } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (adminNote !== undefined) {
    const ret = await addAdminNote(id, adminNote);
    return NextResponse.json({ success: true, return: ret });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
