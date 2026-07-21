import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import * as coinRepo from "@/postgres/repositories/coins";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await coinRepo.getActiveCampaigns();
  return NextResponse.json({ campaigns });
}
