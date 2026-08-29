import { NextRequest, NextResponse } from "next/server";
import { getAffiliateByCode, recordClick } from "@/postgres/repositories/affiliates";

export async function POST(req: NextRequest) {
  try {
    const code = req.cookies.get("b2w_aff")?.value;
    if (!code) return NextResponse.json({ tracked: false });

    const affiliate = await getAffiliateByCode(code);
    if (!affiliate || affiliate.status !== "approved") return NextResponse.json({ tracked: false });

    const { path } = await req.json();
    await recordClick(affiliate.id, path ?? "/", req.headers.get("referer") ?? undefined);
    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false });
  }
}