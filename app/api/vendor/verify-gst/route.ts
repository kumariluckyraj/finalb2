import { NextRequest, NextResponse } from "next/server";
import { searchGSTIN } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  const { gstin } = await req.json();
  if (!gstin) {
    return NextResponse.json({ error: "Missing GSTIN" }, { status: 400 });
  }
  try {
    const result = await searchGSTIN(gstin);

    if (result?.code === 422) {
      return NextResponse.json({ valid: false, message: "Invalid GSTIN format." });
    }

    const found = result?.data?.status_cd === "1";
    const record = result?.data?.data;
    const status = record?.sts; // "Active" | "Cancelled" | "Provisional"
    const valid = found && status === "Active";

    return NextResponse.json({
      valid,
      status,
      legalName: record?.lgnm,
      tradeName: record?.tradeNam,
      message: !found
        ? "No GSTIN record found."
        : status !== "Active"
        ? `GSTIN found but status is "${status}", not Active.`
        : undefined,
    });
  } catch (err) {
    console.error("GST verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}