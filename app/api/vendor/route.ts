import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { findVendorApplicationByEmail, listVendorApplications } from "@/postgres/repositories/vendorApplications";
import { toApiVendorApplication } from "@/lib/apiTransform";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);

  // Admin sees all; vendor sees only their own
  if (user.role === "admin") {
    const vendors = await listVendorApplications();
    return NextResponse.json(vendors.map(toApiVendorApplication));
  }

  if (user.role === "vendor") {
    const app = await findVendorApplicationByEmail(user.email);
    return NextResponse.json(app ? [toApiVendorApplication(app)] : []);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
