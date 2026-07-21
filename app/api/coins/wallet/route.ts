import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getWalletWithTier } from "@/lib/coins/wallet-service";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getWalletWithTier(user.userId);
  return NextResponse.json(result);
}
