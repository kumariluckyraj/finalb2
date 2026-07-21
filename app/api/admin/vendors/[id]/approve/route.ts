import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createUser, findUserByEmail, updateUserRole } from "@/postgres/repositories/users";
import { attachVendorUserId, findVendorApplicationById, updateVendorApplicationStatus } from "@/postgres/repositories/vendorApplications";
import { createSellerProfile } from "@/postgres/repositories/sellerProfiles";
import { createStore } from "@/postgres/repositories/stores";
import { createBankAccount } from "@/postgres/repositories/sellerBankAccounts";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await verifyToken(token);
  if (currentUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();

  const application = await findVendorApplicationById(id);
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const existing = await findUserByEmail(application.email);
    const targetUser = existing ?? await createUser({
      name: application.name,
      email: application.email,
      password: application.password,
      role: "vendor",
    });

    if (existing && existing.role !== "vendor") {
      await updateUserRole(existing.id, "vendor");
    }

    await updateVendorApplicationStatus(id, "approved");
    await attachVendorUserId(id, targetUser.id);

    const profile = await createSellerProfile({
      userId: targetUser.id,
      businessName: application.storeName || application.name,
      businessType: "individual",
      phone: application.mobile,
      addressLine1: application.addressLine1,
      addressLine2: application.addressLine2 || null,
      city: application.city,
      state: application.state,
      pincode: application.pincode,
      gstPan: application.gstNumber || application.panNumber || null,
      businessLogoUrl: application.storeLogoUrl || null,
    });

    await createStore({
      sellerId: profile.id,
      storeName: application.storeName || application.name,
      urlSlug: (application.storeName || application.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      bannerUrl: application.storeBannerUrl || null,
      description: application.storeDescription || null,
      primaryCategory: application.productCategory || null,
      subcategories: [],
    });

    await createBankAccount({
      sellerId: profile.id,
      accountHolderName: application.accountHolderName,
      accountNumber: application.accountNumber,
      confirmAccountNumber: application.accountNumber,
      ifscCode: application.ifscCode,
      bankName: null,
      accountType: "savings",
    });

  } else if (action === "reject") {
    await updateVendorApplicationStatus(id, "rejected");

  } else if (action === "pending") {
    await updateVendorApplicationStatus(id, "pending");
  }

  const updated = await findVendorApplicationById(id);
  return NextResponse.json({ success: true, status: updated?.status });
}
