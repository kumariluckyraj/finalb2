import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { findReturnRequestById, schedulePickup } from "@/postgres/repositories/returnRequests";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();
  const { returnId, pickupAddress, pickupDate, pickupNotes } = body;
  if (!returnId || !pickupAddress || !pickupDate) {
    return NextResponse.json({ error: "returnId, pickupAddress, and pickupDate required" }, { status: 400 });
  }

  const ret = await findReturnRequestById(returnId);
  if (!ret || ret.sellerId !== profile.id) {
    return NextResponse.json({ error: "Return request not found" }, { status: 404 });
  }

  const updated = await schedulePickup(returnId, pickupAddress, new Date(pickupDate), pickupNotes);
  return NextResponse.json({ success: true, return: updated });
}
