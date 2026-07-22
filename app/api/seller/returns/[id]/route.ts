import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { updateSellerOrderStatus } from "@/postgres/repositories/sellerOrders";
import {
  findReturnRequestById, moveToUnderReview, approveReturn, rejectReturn,
  markPickupCompleted, markInTransit, markReceived, startInspection,
  completeInspection, initiateResolution, completeResolution,
} from "@/postgres/repositories/returnRequests";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const { id } = await params;
  const existing = await findReturnRequestById(id);
  if (!existing || existing.sellerId !== profile.id) {
    return NextResponse.json({ error: "Return request not found" }, { status: 404 });
  }

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "review":
      await moveToUnderReview(id);
      break;
    case "approve":
      await approveReturn(id);
      break;
    case "reject":
      // Order itself is untouched — the return request's own status carries the rejection.
      await rejectReturn(id, body.reason);
      break;
    case "pickup_completed":
      await markPickupCompleted(id);
      break;
    case "in_transit":
      await markInTransit(id, body.trackingNumber, body.courier);
      break;
    case "received":
      await markReceived(id);
      break;
    case "start_inspection":
      await startInspection(id);
      break;
    case "inspection_result":
      // Order itself is untouched even on failed inspection — same reasoning as above.
      await completeInspection(id, !!body.passed, body.notes);
      break;
    case "initiate_resolution": {
      const resolutionType = existing.resolutionType ?? "refund";
      await initiateResolution(id, resolutionType);
      break;
    }
    case "complete_resolution": {
      const resolutionType = existing.resolutionType ?? "refund";
      await completeResolution(id, resolutionType, body.refundAmount);
      // Only on a fully completed return (refund/replacement done) does the order become "returned".
      await updateSellerOrderStatus(existing.sellerOrderId, "returned").catch(() => {});
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await findReturnRequestById(id);
  return NextResponse.json({ success: true, return: updated });
}