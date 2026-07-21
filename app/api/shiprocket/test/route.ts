import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps: Record<string, unknown>[] = [];
  const env = {
    email: process.env.SHIPROCKET_EMAIL ? process.env.SHIPROCKET_EMAIL : "(not set)",
    passwordSet: !!process.env.SHIPROCKET_PASSWORD,
  };

  const authResult: Record<string, unknown> = { step: "POST /auth/login" };
  try {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    const body = await res.json();
    authResult.status = res.status;
    authResult.ok = res.ok;
    authResult.body = body;

    if (res.ok && body.token) {
      authResult.token_preview = body.token.slice(0, 20) + "...";

      const srvResult: Record<string, unknown> = { step: "GET /courier/serviceability/" };
      try {
        const srvRes = await fetch(
          "https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110001&delivery_postcode=110001&weight=500&cod=0",
          { headers: { Authorization: `Bearer ${body.token}` } }
        );
        srvResult.status = srvRes.status;
        srvResult.ok = srvRes.ok;
        srvResult.body = await srvRes.json();
      } catch (e) {
        srvResult.error = String(e);
      }
      steps.push(srvResult);
    }
  } catch (e) {
    authResult.error = String(e);
  }
  steps.unshift(authResult);

  return NextResponse.json({ env, steps }, { status: 200 });
}
