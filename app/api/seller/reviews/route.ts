import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import { findStoreBySellerId } from "@/postgres/repositories/stores";
import { listSellerReviews, getStoreRating } from "@/postgres/repositories/sellerReviews";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const reviews = await listSellerReviews(profile.id);
  const store = await findStoreBySellerId(profile.id);
  const storeRating = store ? await getStoreRating(store.id) : { average: 0, count: 0 };

  return NextResponse.json({ reviews, storeRating });
}
