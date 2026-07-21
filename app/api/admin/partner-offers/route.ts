import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createPartnerOffer, listAllPartnerOffers } from "@/postgres/repositories/partnerOffers";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const offers = await listAllPartnerOffers();
    return NextResponse.json({ offers });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const offer = await createPartnerOffer({
      brand: body.brand,
      category: body.category,
      description: body.description,
      coinsRequired: body.coinsRequired,
      discountValue: body.discountValue,
      iconUrl: body.iconUrl,
      tag: body.tag,
      termsUrl: body.termsUrl,
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : undefined,
      perUserLimit: body.perUserLimit ? parseInt(body.perUserLimit) : 1,
      sortOrder: body.sortOrder ? parseInt(body.sortOrder) : 0,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
    return NextResponse.json({ offer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
