import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listMessagesForAdmin, sendAdminMessageToSeller } from "@/postgres/repositories/sellerMessages";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.sellerId || !body.subject || !body.body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const message = await sendAdminMessageToSeller(body.sellerId, body.subject, body.body);
  return NextResponse.json({ success: true, message }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listMessagesForAdmin();
  return NextResponse.json({ messages });
}