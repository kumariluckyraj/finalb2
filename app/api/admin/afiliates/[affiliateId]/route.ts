import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { setAffiliateStatus } from "@/postgres/repositories/affiliates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
  const user = await getAuthUser();
  if (!user?.userId || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { affiliateId } = await params;
  const { status, commissionPercent } = await req.json();
  if (!["approved", "rejected", "suspended"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await setAffiliateStatus(affiliateId, status, commissionPercent ? Number(commissionPercent) : undefined);
  return NextResponse.json({ success: true });
}