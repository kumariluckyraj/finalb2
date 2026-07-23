import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { broadcastMessageToAllSellers, listBroadcasts } from "@/postgres/repositories/sellerMessages";
import { listAllSellerIds } from "@/postgres/repositories/sellerProfiles";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.subject || !body.body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const sellerIds = await listAllSellerIds();
  const messages = await broadcastMessageToAllSellers(body.subject, body.body, sellerIds);
  return NextResponse.json({ success: true, count: messages.length }, { status: 201 });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const broadcasts = await listBroadcasts();
  return NextResponse.json({ broadcasts });
}