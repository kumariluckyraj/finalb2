"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface Banner {
  bg: string;
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  imgUrl: string;
  link: string;
}

// Keep in sync with Navbar.tsx / page.tsx / CategoryGrid.tsx / FeaturedProducts.tsx / TrustBadges.tsx
const PAGE_MAX_W = "max-w-[1200px]";

export default function HeroBanner({
  banners,
  onNavigate,
}: {
  banners: Banner[];
  onNavigate: (path: string) => void;
}) {
  const [idx, setIdx] = useState(0);

  const goTo = useCallback((i: number) => setIdx(i), []);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="w-full bg-white">
      <div className={`${PAGE_MAX_W} mx-auto px-4 md:px-10 py-6 md:py-8`}>
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            // Height scales with container width (not viewport height),
            // so it stays proportional at any screen size.
            height: 'clamp(260px, 20vw, 340px)',
          }}
        >
          {banners.map((b, i) => (
            <div
              key={i}
              className="absolute inset-0 flex transition-opacity duration-700"
              style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
            >
              {/* Left panel — editorial text */}
              <div className="w-full md:w-1/2 bg-[#0c0c0c] flex flex-col justify-center px-8 md:px-12 lg:px-14 py-4 relative z-10">
                {/* Eyebrow */}
                <span
                  className="text-white/70 text-[10px] font-bold uppercase mb-2"
                  style={{ letterSpacing: '0.1em' }}
                >
                  {b.eyebrow}
                </span>

                {/* Display headline */}
                <h1
                  className="display-serif text-white m-0 mb-2 max-w-[380px]"
                  style={{
                    fontSize: 'clamp(22px, 2vw, 32px)',
                    lineHeight: 1.08,
                  }}
                >
                  {b.title}
                </h1>

                {/* Subtext */}
                <p className="text-white/70 text-[13px] m-0 mb-4 max-w-[340px] leading-relaxed">
                  {b.sub}
                </p>

                {/* Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    aria-label={b.cta}
                    onClick={() => onNavigate(b.link)}
                    className="bg-white text-[#1a211e] border-none px-5 py-2 rounded text-[13px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-90"
                    style={{ letterSpacing: '0.057em' }}
                  >
                    {b.cta}
                  </button>
                  <button
                    onClick={() => onNavigate("/products")}
                    className="bg-transparent text-white border border-white px-5 py-2 rounded text-[13px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-80"
                    style={{ letterSpacing: '0.057em' }}
                  >
                    Explore All
                  </button>
                </div>
              </div>

              {/* Right panel — image */}
              <div className="hidden md:block w-1/2 relative">
                <Image
                  src={b.imgUrl}
                  alt={b.title}
                  fill
                  priority={i === 0} // Only preload the first banner for LCP
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  className="absolute inset-0"
                />
                {/* Subtle left-edge gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c]/30 to-transparent w-1/4" />
              </div>
            </div>
          ))}

          {/* Carousel dots */}
          <div className="absolute bottom-4 left-8 md:left-12 lg:left-14 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                aria-label={`Go to slide ${i + 1}`}
                key={i}
                onClick={() => goTo(i)}
                className={`h-[6px] rounded-full border-none p-0 cursor-pointer transition-all duration-300 ${
                  i === idx ? "w-8 bg-white" : "w-[6px] bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}