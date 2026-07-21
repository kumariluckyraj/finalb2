import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { replyToReview, flagReview } from "@/postgres/repositories/sellerReviews";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.reply) {
    const review = await replyToReview(id, body.reply);
    return NextResponse.json({ success: true, review });
  }

  if (body.flag) {
    const review = await flagReview(id, body.flagReason || "Inappropriate");
    return NextResponse.json({ success: true, review });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
