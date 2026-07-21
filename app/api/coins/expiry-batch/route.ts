import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { processExpiryBatch } from "@/lib/coins/wallet-service";

export async function POST() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await processExpiryBatch();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
