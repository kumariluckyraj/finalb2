import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { updateReturnRequestStatus, findReturnRequestById } from "@/postgres/repositories/returnRequests";
import { findSellerOrderById, updateSellerOrderStatus } from "@/postgres/repositories/sellerOrders";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.status === "approved") {
    await updateReturnRequestStatus(id, "approved");
    const ret = await findReturnRequestById(id);
    if (ret) {
      await updateSellerOrderStatus(ret.sellerOrderId, "returned");
    }
  } else if (body.status === "rejected") {
    await updateReturnRequestStatus(id, "rejected");
  } else if (body.status === "refunded") {
    await updateReturnRequestStatus(id, "refunded", "completed", body.refundAmount);
  }

  return NextResponse.json({ success: true });
}
