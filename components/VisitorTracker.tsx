"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function VisitorTracker({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoggedIn) return;

    const productMatch = pathname.match(/^\/product\/([^/]+)/);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        productId: productMatch?.[1],
        eventType: productMatch ? "product_view" : "page_view",
        referrer: document.referrer || undefined,
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      }),
    }).catch(() => {});
  }, [pathname, searchParams, isLoggedIn]);

  return null;
}