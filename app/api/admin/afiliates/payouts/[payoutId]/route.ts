import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { updatePayoutStatus } from "@/postgres/repositories/affiliates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { payoutId } = await params;
  const { status, notes } = await req.json();
  if (!["processing", "paid", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updatePayoutStatus(payoutId, status, notes);
  return NextResponse.json({ success: true });
}