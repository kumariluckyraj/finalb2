import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createMessage } from "@/postgres/repositories/sellerMessages";
import { createBroadcast, listBroadcasts, updateBroadcastCounts } from "@/postgres/repositories/broadcasts";
import { query } from "@/postgres/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcasts = await listBroadcasts();
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject, body: messageBody } = body;
  if (!subject || !messageBody) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  // Create the broadcast record
  const broadcast = await createBroadcast({ adminId: user.userId, subject, body: messageBody });

  // Get all approved sellers
  const { rows: sellers } = await query<{ id: string }>(
    `SELECT id FROM seller_profiles WHERE status = 'approved'`
  );

  // Create a seller_message for each seller
  let sentCount = 0;
  for (const seller of sellers) {
    await createMessage({
      sellerId: seller.id,
      subject,
      body: messageBody,
      direction: "incoming",
      senderType: "support",
      broadcastId: broadcast.id,
    });
    sentCount++;
  }

  await updateBroadcastCounts(broadcast.id, sellers.length, sentCount);

  return NextResponse.json({ success: true, broadcast, sentTo: sentCount }, { status: 201 });
}
