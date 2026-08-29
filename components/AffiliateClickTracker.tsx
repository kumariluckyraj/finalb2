"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AffiliateClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const hasRef = document.cookie.includes("b2w_aff=");
    if (!hasRef) return;
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}