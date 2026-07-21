import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { getUserRedemptions } from "@/postgres/repositories/partnerOffers";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);

    const redemptions = await getUserRedemptions(user.userId);
    return NextResponse.json({ redemptions });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
