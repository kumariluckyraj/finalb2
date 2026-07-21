import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { createMessage, listMessagesBySeller, countUnreadMessages } from "@/postgres/repositories/sellerMessages";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const messages = await listMessagesBySeller(profile.id);
  const unreadCount = await countUnreadMessages(profile.id);

  return NextResponse.json({ messages, unreadCount });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();
  const message = await createMessage({
    sellerId: profile.id,
    userId: body.userId || undefined,
    orderId: body.orderId || undefined,
    subject: body.subject,
    body: body.body,
    direction: "outgoing",
    senderType: body.senderType || "seller",
  });

  return NextResponse.json({ success: true, message }, { status: 201 });
}
