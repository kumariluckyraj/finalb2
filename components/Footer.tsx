"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (
    pathname === "/checkout" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return null;
  }

  return (
    <footer className="bg-[#1a211e] text-white mt-auto">
      {/* Main footer content */}
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="text-[22px] font-extrabold tracking-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              B2World
            </div>
            <p className="text-white/50 text-[14px] leading-relaxed m-0 mb-6 max-w-[280px]">
              India&apos;s growing online marketplace. Shop from lakhs of products with secure payments and pan-India delivery.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {["Facebook", "Twitter", "Instagram", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 transition-all duration-200 text-[12px] font-bold uppercase"
                >
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4
              className="text-[12px] font-bold uppercase mb-5 text-white/40"
              style={{ letterSpacing: '0.1em' }}
            >
              Support
            </h4>
            <ul className="list-none p-0 m-0 space-y-3">
              <li><Link href="/faq" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Shipping</Link></li>
              <li><Link href="/cancellation" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/payments" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Payments</Link></li>
              <li><Link href="/about" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4
              className="text-[12px] font-bold uppercase mb-5 text-white/40"
              style={{ letterSpacing: '0.1em' }}
            >
              About
            </h4>
            <ul className="list-none p-0 m-0 space-y-3">
              <li><Link href="/about" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/careers" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/stories" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">B2World Stories</Link></li>
              <li><Link href="/sell-online" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Become a Seller</Link></li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h4
              className="text-[12px] font-bold uppercase mb-5 text-white/40"
              style={{ letterSpacing: '0.1em' }}
            >
              Shop
            </h4>
            <ul className="list-none p-0 m-0 space-y-3">
              <li><Link href="/products/fashion" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Fashion</Link></li>
              <li><Link href="/products/electronics" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Electronics</Link></li>
              <li><Link href="/products/mobile" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Mobiles</Link></li>
              <li><Link href="/products/beauty" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Beauty</Link></li>
              <li><Link href="/products/food" className="text-white/70 text-[14px] no-underline hover:text-white transition-colors">Grocery</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-white/30 text-[13px]">
            © 2007-{new Date().getFullYear()} B2World.com. All rights reserved.
          </div>
          <div className="flex gap-6 text-[13px]">
            <Link href="/policy/terms" className="text-white/30 no-underline hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/policy/privacy" className="text-white/30 no-underline hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/policy/security" className="text-white/30 no-underline hover:text-white/60 transition-colors">Security</Link>
            <Link href="/sitemap" className="text-white/30 no-underline hover:text-white/60 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
