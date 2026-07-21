// components/NavbarServer.tsx
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId } from "@/postgres/repositories/sellerProfiles";
import Navbar from "./Navbar";

export default async function NavbarServer() {
  const user = await getAuthUser();
  let hasSellerProfile = false;
  let sellerOnboardingCompleted = false;
  if (user) {
    const sp = await findSellerProfileByUserId(user.userId);
    if (sp) {
      hasSellerProfile = true;
      sellerOnboardingCompleted = sp.onboardingCompleted ?? false;
    }
  }
  return <Navbar user={user} hasSellerProfile={hasSellerProfile} sellerOnboardingCompleted={sellerOnboardingCompleted} />;
}