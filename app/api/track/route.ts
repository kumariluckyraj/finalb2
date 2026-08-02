import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { upsertVisitorSession, logPageView, hashIp } from "@/postgres/repositories/analytics";

const VISITOR_COOKIE = "b2w_visitor_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, productId, eventType, referrer, utmSource, utmMedium, utmCampaign } = body;

    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
    const isNewVisitor = !visitorId;
    if (!visitorId) visitorId = crypto.randomUUID();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await upsertVisitorSession({
      visitorId,
      path: path ?? "/",
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      userAgent,
      ipHash: hashIp(ip),
    });

    await logPageView({ visitorId, path: path ?? "/", productId, eventType });

    const res = NextResponse.json({ ok: true });
    if (isNewVisitor) {
      res.cookies.set(VISITOR_COOKIE, visitorId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return res;
  } catch (err) {
    console.error("POST /api/track error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}