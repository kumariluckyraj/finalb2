import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findPartnerOfferById, createRedemption, incrementOfferUsage, getUserRedemptionCountForOffer } from "@/postgres/repositories/partnerOffers";
import { redeemCoins } from "@/lib/coins/wallet-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);

    const { id } = await params;
    const offer = await findPartnerOfferById(id);
    if (!offer || !offer.isActive || new Date() < new Date(offer.startsAt) || new Date() > new Date(offer.endsAt)) {
      return NextResponse.json({ error: "Offer not available" }, { status: 404 });
    }
    if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
      return NextResponse.json({ error: "Offer fully redeemed" }, { status: 400 });
    }

    const userRedemptions = await getUserRedemptionCountForOffer(offer.id, user.userId);
    if (userRedemptions >= offer.perUserLimit) {
      return NextResponse.json({ error: "Already redeemed" }, { status: 400 });
    }

    const brandPrefix = offer.brand.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const couponCode = `B2W-${brandPrefix}-${randomPart}`;

    await redeemCoins({ userId: user.userId, amount: offer.coinsRequired, referenceType: "partner_offer", referenceId: offer.id, description: `Redeemed ${offer.coinsRequired} SC for ${offer.brand} offer` });

    await createRedemption(offer.id, user.userId, couponCode, offer.coinsRequired);
    await incrementOfferUsage(offer.id);

    return NextResponse.json({ success: true, couponCode, coinsSpent: offer.coinsRequired });
  } catch (err: any) {
    if (err.message?.includes?.("Insufficient")) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
