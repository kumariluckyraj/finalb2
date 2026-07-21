"use client";
import Image from "next/image";
import { useRef } from "react";

interface ProductData {
  _id: string;
  name: string;
  image: string;
  price: number;
  actualPrice: number;
  discount: number;
  category?: string;
}

export default function RecentlyViewed({
  products,
  onProductClick,
}: {
  products: ProductData[];
  onProductClick: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        {/* Section heading */}
        <h2
          className="display-serif text-[#1a211e] m-0 mb-10"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}
        >
          Recently Viewed —
        </h2>

        {/* Carousel */}
        <div className="relative">
          {/* Left arrow */}
          <button
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#e0e0e0] items-center justify-center cursor-pointer hover:bg-[#eef1f0] transition-colors hidden md:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {products.map((p) => (
              <div
                key={p._id}
                onClick={() => onProductClick(p._id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onProductClick(p._id); } }}
                role="button"
                tabIndex={0}
                className="min-w-[200px] w-[200px] shrink-0 cursor-pointer group"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#eef1f0] mb-3">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#606562] text-xs">No image</div>
                  )}
                </div>
                {/* Info */}
                <p className="text-[14px] text-[#1a211e] m-0 mb-1 font-normal truncate">
                  {p.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[14px] font-normal text-[#1a211e]">₹{p.price?.toLocaleString("en-IN")}</span>
                  {p.actualPrice > p.price && (
                    <span className="text-[12px] text-[#cccfcd] line-through">
                      ₹{p.actualPrice?.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#e0e0e0] items-center justify-center cursor-pointer hover:bg-[#eef1f0] transition-colors hidden md:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
