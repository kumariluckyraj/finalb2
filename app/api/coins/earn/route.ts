import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { earnCoins } from "@/lib/coins/wallet-service";
import * as coinRepo from "@/postgres/repositories/coins";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { amount, source, referenceType, referenceId, description, isPending, campaignId, expiryDate } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 });
    }

    const tx = await earnCoins({
      userId: user.userId,
      amount,
      source,
      referenceType: referenceType ?? undefined,
      referenceId: referenceId ?? undefined,
      campaignId: campaignId ?? undefined,
      description: description ?? undefined,
      isPending: isPending ?? false,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    return NextResponse.json({ transaction: tx });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to earn coins" }, { status: 400 });
  }
}
