import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import type { SellerProfileRecord } from "@/postgres/models/SellerProfile";

export async function requireSeller(): Promise<{ user: Awaited<ReturnType<typeof getAuthUser>>; profile: SellerProfileRecord }> {
  const user = await getAuthUser();
  if (!user) throw { status: 401, message: "Unauthorized" };

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) throw { status: 404, message: "Seller profile not found. Complete onboarding first." };

  if (!profile.onboardingCompleted) throw { status: 400, message: "Seller onboarding not completed" };

  return { user, profile };
}
