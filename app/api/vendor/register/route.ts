import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { uploadFile } from "@/lib/cloudinary";
import { createVendorApplication, findVendorApplicationByEmail } from "@/postgres/repositories/vendorApplications";
import { toApiVendorApplication } from "@/lib/apiTransform";

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const get = (k: string) => fd.get(k) as string;

    // Validate required fields
    const email = get("email");
    const existing = await findVendorApplicationByEmail(email);
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    // Hash password
    const password = await bcrypt.hash(get("password"), 10);

    // For files: in production, upload to S3/Cloudinary and store URLs.
    // Here we store filename strings as placeholders.
    const aadhaarFile = fd.get("aadhaarCard") as File;
    const gstFile = fd.get("gstCertificate") as File;
    const panFile = fd.get("panCard") as File;
    const logoFile = fd.get("storeLogo") as File | null;
    const bannerFile = fd.get("storeBanner") as File | null;

    const [aadhaarCardUrl, gstCertificateUrl, panCardUrl] = await Promise.all([
      uploadFile(aadhaarFile, "vendor-docs/aadhaar"),
      uploadFile(gstFile, "vendor-docs/gst"),
      uploadFile(panFile, "vendor-docs/pan"),
    ]);

    const storeLogoUrl = logoFile ? await uploadFile(logoFile, "vendor-docs/logos") : "";
    const storeBannerUrl = bannerFile ? await uploadFile(bannerFile, "vendor-docs/banners") : "";
    const application = await createVendorApplication({
      name: get("name"),
      email,
      password,
      mobile: get("mobile"),
      gstNumber: get("gstNumber"),
      panNumber: get("panNumber"),
      aadhaarCardUrl,
      gstCertificateUrl,
      panCardUrl,
      accountHolderName: get("accountHolderName"),
      accountNumber: get("accountNumber"),
      ifscCode: get("ifscCode"),
      storeName: get("storeName"),
      storeDescription: get("storeDescription"),
      storeLogoUrl,
      storeBannerUrl,
      productCategory: get("productCategory"),
      addressLine1: get("addressLine1"),
      addressLine2: get("addressLine2"),
      city: get("city"),
      state: get("state"),
      pincode: get("pincode"),
      status: "pending",
    });

    return NextResponse.json({ success: true, id: toApiVendorApplication(application)._id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
