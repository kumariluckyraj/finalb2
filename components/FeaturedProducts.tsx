"use client";
import { useState, useRef } from "react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

interface ProductData {
  _id: string;
  id: string;
  name: string;
  image: string;
  price: number;
  actualPrice: number;
  discount: number;
  category?: string;
  brand?: string;
}

const FILTER_CATEGORIES = [
  "All",
  "Fashion",
  "Mobiles",
  "Electronics",
  "Beauty",
  "Grocery",
  "Furniture",
  "Sports",
  "Books",
];

export default function FeaturedProducts({
  products,
  loading,
  onAddToCart,
  onViewAll,
  onProductClick,
}: {
  products: ProductData[];
  loading: boolean;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onViewAll: () => void;
  onProductClick: (id: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!loading && products.length === 0) return null;

  const filteredProducts = activeFilter === "All"
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeFilter.toLowerCase());

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        {/* Section heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <h2
            className="display-serif text-[#1a211e] m-0"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
          >
            Featured Products —
          </h2>
          <button
            aria-label="View all products"
            onClick={onViewAll}
            className="bg-transparent text-[#1a211e] border border-[#1a211e] px-5 py-2.5 rounded text-[13px] font-bold uppercase cursor-pointer transition-colors hover:bg-[#1a211e] hover:text-white self-start md:self-auto"
            style={{ letterSpacing: '0.057em' }}
          >
            View All
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-hide pb-1">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-bold uppercase cursor-pointer border transition-all duration-200 ${
                activeFilter === cat
                  ? "bg-[#1a211e] text-white border-[#1a211e]"
                  : "bg-transparent text-[#363537] border-[#cccfcd] hover:border-[#1a211e]"
              }`}
              style={{ letterSpacing: '0.04em' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product carousel */}
        <div className="relative">
          {/* Left arrow */}
          <button
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center cursor-pointer hover:bg-[#eef1f0] transition-colors hidden md:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a211e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Products row */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[260px] w-[260px] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <ProductCardSkeleton />
                  </div>
                ))
              : (filteredProducts.length > 0 ? filteredProducts : products).map((p) => (
                  <div key={p._id} className="min-w-[260px] w-[260px] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <ProductCard
                      product={p}
                      onAddToCart={onAddToCart}
                      onClick={onProductClick}
                    />
                  </div>
                ))}
          </div>

          {/* Right arrow */}
          <button
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center cursor-pointer hover:bg-[#eef1f0] transition-colors hidden md:flex"
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
