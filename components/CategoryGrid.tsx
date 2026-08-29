"use client";
import Image from "next/image";

interface Category {
  id: string;
  label: string;
  img: string;
}

// Keep in sync with Navbar.tsx / page.tsx / HeroBanner.tsx / FeaturedProducts.tsx / TrustBadges.tsx
const PAGE_MAX_W = "max-w-[1200px]";

// Arrow icon for category cards
const ArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function CategoryGrid({
  categories,
  onCategoryClick,
}: {
  categories: Category[];
  onCategoryClick: (id: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className={`${PAGE_MAX_W} mx-auto px-4 md:px-10`}>
        {/* Section heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
          <h2
            className="display-serif text-[#1a211e] m-0"
            style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}
          >
            Explore our products —
          </h2>
          <button
            aria-label="View all categories"
            onClick={() => onCategoryClick("")}
            className="bg-transparent text-[#1a211e] border border-[#1a211e] px-5 py-2.5 rounded text-[13px] font-bold uppercase cursor-pointer transition-colors hover:bg-[#1a211e] hover:text-white self-start md:self-auto"
            style={{ letterSpacing: '0.057em' }}
          >
            View All
          </button>
        </div>

        {/* 3-column + 2-column grid (Peak Design pattern) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top row: 3 cards */}
          {categories.slice(0, 3).map((cat) => (
            <button
              aria-label={`Shop ${cat.label}`}
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className="relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer group bg-[#eef1f0] border-none p-0 text-left"
            >
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                style={{ objectFit: "cover" }}
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <span className="text-white text-[18px] font-bold uppercase tracking-[0.04em]">{cat.label}</span>
                <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#1a211e] transition-all duration-300">
                  <ArrowIcon />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Second row: 2 wider cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {categories.slice(3, 5).map((cat) => (
            <button
              aria-label={`Shop ${cat.label}`}
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className="relative overflow-hidden rounded-lg aspect-[21/9] cursor-pointer group bg-[#eef1f0] border-none p-0 text-left"
            >
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <span className="text-white text-[18px] font-bold uppercase tracking-[0.04em]">{cat.label}</span>
                <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#1a211e] transition-all duration-300">
                  <ArrowIcon />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Third row: 3 cards */}
        {categories.length > 5 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {categories.slice(5, 8).map((cat) => (
              <button
                aria-label={`Shop ${cat.label}`}
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className="relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer group bg-[#eef1f0] border-none p-0 text-left"
              >
                <Image
                  src={cat.img}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  style={{ objectFit: "cover" }}
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <span className="text-white text-[18px] font-bold uppercase tracking-[0.04em]">{cat.label}</span>
                  <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#1a211e] transition-all duration-300">
                    <ArrowIcon />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}