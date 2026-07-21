import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { findSellerOrderById, updateSellerOrderStatus, updateSellerOrderTracking } from "@/postgres/repositories/sellerOrders";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await findSellerOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.status) {
    const order = await updateSellerOrderStatus(id, body.status);
    return NextResponse.json({ success: true, order });
  }

  if (body.trackingNumber) {
    const order = await updateSellerOrderTracking(id, {
      trackingNumber: body.trackingNumber,
      trackingCompany: body.trackingCompany,
    });
    return NextResponse.json({ success: true, order });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
