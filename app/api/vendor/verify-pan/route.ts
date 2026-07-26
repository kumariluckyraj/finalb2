import { NextRequest, NextResponse } from "next/server";
import { verifyPAN } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  const { pan, name, dob } = await req.json();
  if (!pan || !name || !dob) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const result = await verifyPAN(pan, name, dob);
    const d = result?.data;

    const valid =
      d?.status === "valid" &&
      d?.name_as_per_pan_match === true &&
      d?.date_of_birth_match === true;

    return NextResponse.json({
      valid,
      status: d?.status,
      nameMatch: d?.name_as_per_pan_match,
      dobMatch: d?.date_of_birth_match,
    });
  } catch (err) {
    console.error("PAN verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}