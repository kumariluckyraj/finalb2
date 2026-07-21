import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createSellerProfile, findSellerProfileByUserId, updateSellerProfile } from "@/postgres/repositories/sellerProfiles";
import { createStore, findStoreBySellerId, updateStore } from "@/postgres/repositories/stores";
import { createBankAccount, findBankAccountBySellerId, updateBankAccount } from "@/postgres/repositories/sellerBankAccounts";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ onboardingStep: 0, onboardingCompleted: false });

  const store = await findStoreBySellerId(profile.id);
  const bank = await findBankAccountBySellerId(profile.id);

  return NextResponse.json({ profile, store, bank, onboardingStep: profile.onboardingStep, onboardingCompleted: profile.onboardingCompleted });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { step, ...data } = body;

  let profile = await findSellerProfileByUserId(user.userId);

  if (!profile) {
    profile = await createSellerProfile({
      userId: user.userId,
      businessName: data.businessName || user.name || "",
      businessType: data.businessType || "individual",
      phone: data.phone || "",
      addressLine1: data.addressLine1 || "",
      addressLine2: data.addressLine2 || null,
      city: data.city || "",
      state: data.state || "",
      pincode: data.pincode || "",
      gstPan: data.gstPan || null,
      businessLogoUrl: data.businessLogoUrl || null,
    });
  }

  if (!profile) {
    return NextResponse.json({ error: "Failed to create seller profile" }, { status: 500 });
  }

  if (step === 1) {
    profile = await updateSellerProfile(profile.id, {
      businessName: data.businessName,
      businessType: data.businessType,
      phone: data.phone,
      gstPan: data.gstPan || null,
      onboardingStep: 1,
    });
  }

  if (step === 2) {
    profile = await updateSellerProfile(profile!.id, {
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      onboardingStep: 2,
    });

    if (data.accountHolderName) {
      const existingBank = await findBankAccountBySellerId(profile!.id);
      if (existingBank) {
        await updateBankAccount(profile!.id, {
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          confirmAccountNumber: data.confirmAccountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName || null,
          accountType: data.accountType || "savings",
        });
      } else {
        await createBankAccount({
          sellerId: profile!.id,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          confirmAccountNumber: data.confirmAccountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName || null,
          accountType: data.accountType || "savings",
        });
      }
    }
  }

  if (step === 3) {
    const existingStore = await findStoreBySellerId(profile!.id);
    const storeData = {
      sellerId: profile!.id,
      storeName: data.storeName,
      urlSlug: data.urlSlug || data.storeName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      bannerUrl: data.bannerUrl || null,
      description: data.description || null,
      shippingPolicy: data.shippingPolicy || null,
      returnPolicy: data.returnPolicy || null,
      primaryCategory: data.primaryCategory || null,
      subcategories: data.subcategories || [],
    };

    if (existingStore) {
      await updateStore(profile!.id, storeData);
    } else {
      await createStore(storeData);
    }

    profile = await updateSellerProfile(profile!.id, { onboardingStep: 3, onboardingCompleted: true });
  }

  if (profile && data.businessLogoUrl) {
    profile = await updateSellerProfile(profile.id, { businessLogoUrl: data.businessLogoUrl });
  }

  const store = profile ? await findStoreBySellerId(profile.id) : null;
  const bank = profile ? await findBankAccountBySellerId(profile.id) : null;

  return NextResponse.json({
    success: true,
    profile,
    store,
    bank,
    onboardingStep: profile?.onboardingStep ?? 0,
    onboardingCompleted: profile?.onboardingCompleted ?? false,
  });
}
