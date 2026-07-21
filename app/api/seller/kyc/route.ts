import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { findSellerProfileByUserId, updateSellerProfile } from "@/postgres/repositories/sellerProfiles";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  return NextResponse.json({
    kycStatus: profile.kycStatus,
    kycMethod: profile.kycMethod,
    panNumber: profile.panNumber,
    gstNumber: profile.gstNumber,
    gstPan: profile.gstPan,
    kycVerifiedAt: profile.kycVerifiedAt,
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await findSellerProfileByUserId(user.userId);
  if (!profile) return NextResponse.json({ error: "Not a seller" }, { status: 404 });

  const body = await req.json();
  const { method, panNumber, gstNumber } = body;

  if (!method || !["manual", "digilocker"].includes(method)) {
    return NextResponse.json({ error: "Invalid method. Use 'manual' or 'digilocker'" }, { status: 400 });
  }

  if (method === "digilocker") {
    // Digilocker OAuth integration placeholder
    // In production: redirect user to Digilocker, receive access token,
    // fetch PAN/GST docs, verify against govt database, auto-verify
    return NextResponse.json({
      message: "Digilocker integration coming soon. For now, please use manual verification.",
      digilockerUrl: null,
    });
  }

  // Manual verification - store details, mark as pending
  await updateSellerProfile(profile.id, {
    panNumber: panNumber || null,
    gstNumber: gstNumber || null,
    gstPan: gstNumber || panNumber || profile.gstPan,
    kycStatus: "pending",
    kycMethod: "manual",
    kycVerifiedAt: null,
  });

  return NextResponse.json({
    success: true,
    message: "Documents submitted for verification. This typically takes 24-48 hours.",
    kycStatus: "pending",
  });
}
