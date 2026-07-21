import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listActivePartnerOffers } from "@/postgres/repositories/partnerOffers";

export async function GET() {
  try {
    const offers = await listActivePartnerOffers();
    return NextResponse.json({ offers });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
