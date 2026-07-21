import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerProfile = await findSellerProfileByUserId(user.userId);

  return NextResponse.json({
    user,
    hasSellerProfile: !!sellerProfile,
    sellerOnboardingCompleted: sellerProfile?.onboardingCompleted ?? false,
  });
}
