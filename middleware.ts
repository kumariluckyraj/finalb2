import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN;
const SELLER_DOMAIN = process.env.SELLER_DOMAIN;
const ADMIN_ROLES = ["admin", "sub_admin"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/admin":     ["admin", "sub_admin"],
  "/dashboard": ["customer", "vendor"],
  "/checkout":  ["customer", "vendor"],
"/wishlist":  ["customer", "vendor", "admin", "sub_admin"],
};

function matchesSubdomain(hostname: string, fullDomain: string | undefined): boolean {
  if (!fullDomain) return false;
  const prefix = fullDomain.split(".")[0];
  return hostname === fullDomain || hostname.startsWith(prefix + ".");
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  // Let all API routes pass through without subdomain-based redirects
  if (path.startsWith("/api/")) return NextResponse.next();
  // Use headers first (they carry the real subdomain in dev),
  // fall back to nextUrl.hostname for production.
  const raw = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.hostname || "";
  const hostname = raw.split(":")[0];

  // ─── Admin subdomain enforcement ─────────────────────────────────
  if (matchesSubdomain(hostname, ADMIN_DOMAIN)) {
  if (path === "/login" || path === "/unauthorized") return NextResponse.next();
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!ADMIN_ROLES.includes(payload.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path === "/") return NextResponse.rewrite(new URL("/admin", req.url));
    if (!path.startsWith("/admin")) return NextResponse.redirect(new URL("/admin", req.url));

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

  // ─── Seller subdomain enforcement ────────────────────────────────
  if (matchesSubdomain(hostname, SELLER_DOMAIN)) {
    if (path === "/login" || path === "/unauthorized" || path === "/sell-online" || path === "/register") return NextResponse.next();
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== "vendor") return NextResponse.redirect(new URL("/unauthorized", req.url));

      if (path === "/") return NextResponse.rewrite(new URL("/vendor", req.url));
      if (!path.startsWith("/vendor")) return NextResponse.redirect(new URL("/vendor", req.url));

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ─── Main domain: admin and vendor pages not accessible here ────
  if (path.startsWith("/admin") || path.startsWith("/vendor"))
    return NextResponse.redirect(new URL("/", req.url));

  // ─── Main domain role-based routing ──────────────────────────────
  const matchedRoute = Object.keys(ROLE_ROUTES).find((r) => path.startsWith(r));
  if (!matchedRoute) return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const allowed = ROLE_ROUTES[matchedRoute];
    if (!allowed.includes(payload.role as string))
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};