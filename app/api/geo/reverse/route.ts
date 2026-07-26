import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          // Nominatim's usage policy requires a real identifying User-Agent.
          // Replace with your actual app name and a contact email/URL.
          "User-Agent": "YourAppName/1.0 (contact@yourapp.com)",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 });
    }

    const data = await res.json();
    const addr = data.address || {};

    return NextResponse.json({
      pincode: addr.postcode || null,
      district: addr.state_district || addr.county || addr.district || null,
      state: addr.state || null,
    });
  } catch (err) {
    console.error("geo/reverse error:", err);
    return NextResponse.json({ error: "Could not resolve location" }, { status: 500 });
  }
}