import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { listVendorApplications } from "@/postgres/repositories/vendorApplications";
import { toApiVendorApplication } from "@/lib/apiTransform";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vendors = await listVendorApplications();
  return NextResponse.json(vendors.map(toApiVendorApplication));
}
