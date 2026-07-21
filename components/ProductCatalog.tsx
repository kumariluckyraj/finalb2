"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readStringArray, upsertRecentSearch } from "@/lib/clientStorage";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

type Product = {
  _id: string;
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  actualPrice: number;
  discount: number;
  image: string;
  stock?: number;
  brand?: string;
  flavor?: string;
  author?: string;
  material?: string;
  size?: string;
};

const RECENT_SEARCH_KEY = "b2world_recent_searches";

// Chevron down icon
const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Filter icon
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export default function ProductCatalog({
  apiBase,
  title,
  subtitle,
  accentLabel,
  showSearch = false,
  bannerImage,
}: {
  apiBase: string;
  title: string;
  subtitle?: string;
  accentLabel?: string;
  showSearch?: boolean;
  bannerImage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [draftQuery, setDraftQuery] = useState(searchParams.get("q") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);

  useEffect(() => {
    setDraftQuery(searchParams.get("q") ?? "");
    setQuery(searchParams.get("q") ?? "");
    setSort(searchParams.get("sort") ?? "newest");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
    setInStockOnly(searchParams.get("inStock") === "true");
  }, [searchParams]);

  useEffect(() => {
    setRecentSearches(readStringArray(RECENT_SEARCH_KEY));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(apiBase, window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      if (sort) url.searchParams.set("sort", sort);
      if (minPrice) url.searchParams.set("minPrice", minPrice);
      if (maxPrice) url.searchParams.set("maxPrice", maxPrice);
      if (inStockOnly) url.searchParams.set("inStock", "true");
      
      const res = await fetch(url.toString());
      const data = await res.json();
      
      const mapped = (data.products || []).map((p: any) => ({
        ...p,
        id: p.id || p._id,
        actualPrice: p.actualPrice || p.price,
        discount: p.discount || 0
      }));
      setProducts(mapped);
    } catch (err) {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, [query, sort, minPrice, maxPrice, inStockOnly, apiBase]);

  const submitSearch = (nextQuery = draftQuery) => {
    const trimmed = nextQuery.trim();
    setQuery(trimmed);
    setDraftQuery(trimmed);
    if (trimmed) {
      const updated = upsertRecentSearch(RECENT_SEARCH_KEY, trimmed);
      setRecentSearches(updated);
    }
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (draftQuery.trim()) params.set("q", draftQuery.trim());
    if (sort !== "newest") params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStockOnly) params.set("inStock", "true");
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url, { scroll: false });
  };

  const clearFilters = () => {
    setDraftQuery("");
    setQuery("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    router.replace(pathname, { scroll: false });
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        setCartToast("Added to cart!");
        window.dispatchEvent(new CustomEvent("cart-updated"));
        setTimeout(() => setCartToast(null), 2500);
        router.refresh();
      } else if (res.status === 401) {
        router.push("/login?redirect=" + pathname);
      } else {
        throw new Error("Request failed");
      }
    } catch (err) {
      setCartToast("Failed to add item.");
      setTimeout(() => setCartToast(null), 3000);
    }
  };

  const renderGridBanner = () => (
    <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-lg aspect-square md:aspect-[2/1] bg-[#eef1f0] flex flex-col justify-end p-6 md:p-8 cursor-pointer group">
      <img
        src={bannerImage || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1200&q=80"}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 text-white">
        <h3 className="display-serif m-0 mb-2" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
          The {title} Collection
        </h3>
        <p className="m-0 text-[14px] opacity-80 max-w-[400px]">
          Discover our curated selection of premium gear designed to elevate your everyday carry.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a211e]">
      
      {/* Toast */}
      {cartToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] px-7 py-3 rounded text-[14px] font-bold text-white flex items-center gap-2 animate-[fadeIn_0.2s_ease]"
             style={{ background: cartToast.includes("Failed") ? "#cc2e39" : "#1a211e", letterSpacing: '0.02em' }}>
          {cartToast}
        </div>
      )}

      {/* Collection Banner (Header) */}
      <div className="relative w-full bg-[#f8f9f8] overflow-hidden">
        {bannerImage && (
          <>
            <img src={bannerImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        
        <div className="relative z-10 max-w-[1440px] mx-auto">
          {/* Breadcrumb - Minimal */}
          <div className={`px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.05em] ${bannerImage ? "text-white/80" : "text-[#606562]"}`}>
            <span onClick={() => router.push("/")} className={`cursor-pointer transition-colors ${bannerImage ? "hover:text-white" : "hover:text-[#1a211e]"}`}>Home</span>
            <span className="mx-2 opacity-50">/</span>
            <span className={bannerImage ? "text-white" : "text-[#1a211e]"}>{title}</span>
          </div>

          <div className="px-5 py-12 md:py-24 text-center">
            {accentLabel && (
              <div className={`text-[12px] font-bold uppercase tracking-[0.1em] mb-4 ${bannerImage ? "text-white/80" : "text-[#606562]"}`}>
                {accentLabel}
              </div>
            )}
            <h1 className={`display-serif m-0 mb-4 ${bannerImage ? "text-white" : "text-[#1a211e]"}`} style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className={`m-0 text-[16px] max-w-[600px] mx-auto leading-relaxed ${bannerImage ? "text-white/90" : "text-[#606562]"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-[100] bg-white border-y border-[#e0e0e0]">
        <div className="max-w-[1440px] mx-auto px-5 h-[56px] flex items-center justify-between">
          <div className="text-[13px] font-bold text-[#606562] uppercase tracking-[0.05em]">
            {loading ? "Loading..." : `${products.length} Items`}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-transparent border-none text-[#1a211e] text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <FilterIcon /> Filter
            </button>

            <div className="h-4 w-px bg-[#e0e0e0]" />

            <div className="relative group">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); applyFilters(); }}
                className="appearance-none bg-transparent border-none text-[#1a211e] text-[13px] font-bold uppercase tracking-[0.05em] cursor-pointer pr-5 outline-none hover:opacity-70 transition-opacity"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount-desc">Biggest Discount</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a211e]">
                <ChevronDown />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="bg-[#eef1f0] border-b border-[#e0e0e0] animate-[fadeSlideDown_0.2s_ease]">
          <div className="max-w-[1440px] mx-auto px-5 py-6 flex flex-wrap gap-6 items-end">
            {showSearch && (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#606562]">Search</label>
                <input
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
                  placeholder="Keywords..."
                  className="w-[200px] h-10 px-3 bg-white border border-[#cccfcd] rounded outline-none text-[14px] focus:border-[#1a211e] transition-colors"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#606562]">Price Range</label>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min ₹" type="number" min="0" className="w-[100px] h-10 px-3 bg-white border border-[#cccfcd] rounded outline-none text-[14px] focus:border-[#1a211e] transition-colors" />
                <span className="text-[#606562]">-</span>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max ₹" type="number" min="0" className="w-[100px] h-10 px-3 bg-white border border-[#cccfcd] rounded outline-none text-[14px] focus:border-[#1a211e] transition-colors" />
              </div>
            </div>
            <div className="flex items-center h-10">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold uppercase tracking-[0.05em] text-[#1a211e]">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 accent-[#1a211e]" />
                In stock only
              </label>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={clearFilters} className="h-10 px-6 bg-white text-[#1a211e] border border-[#cccfcd] rounded text-[13px] font-bold uppercase cursor-pointer hover:border-[#1a211e] transition-colors tracking-[0.05em]">Reset</button>
              <button onClick={() => submitSearch()} className="h-10 px-6 bg-[#1a211e] text-white border-none rounded text-[13px] font-bold uppercase cursor-pointer hover:bg-[#363537] transition-colors tracking-[0.05em]">Apply</button>
            </div>
          </div>
          
          {/* Recent Searches */}
          {showSearch && !query && recentSearches.length > 0 && (
            <div className="max-w-[1440px] mx-auto px-5 pb-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#606562] mb-3">Recent Searches</div>
              <div className="flex gap-2 flex-wrap">
                {recentSearches.map((item) => (
                  <button key={item} onClick={() => { setDraftQuery(item); submitSearch(item); }} className="h-8 px-4 bg-white border border-[#cccfcd] rounded-full text-[12px] font-medium text-[#1a211e] cursor-pointer hover:border-[#1a211e] transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Area */}
      <div className="max-w-[1440px] mx-auto px-5 py-12 md:py-16">
        {error && (
          <div className="bg-[#fef2f2] text-[#cc2e39] p-4 rounded mb-8 text-[14px] font-medium text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="display-serif text-[#1a211e] m-0 mb-4" style={{ fontSize: '32px' }}>No products found</h3>
            <p className="text-[#606562] text-[16px]">Try adjusting your filters or search term.</p>
            <button onClick={clearFilters} className="mt-8 h-12 px-8 bg-[#1a211e] text-white border-none rounded text-[13px] font-bold uppercase cursor-pointer hover:bg-[#363537] transition-colors tracking-[0.05em]">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-12">
            {products.map((p, index) => {
              // Inject editorial banner at position 4
              const isBannerPosition = index === 4;
              
              return (
                <React.Fragment key={p._id}>
                  {isBannerPosition && renderGridBanner()}
                  <div className="col-span-1">
                    <ProductCard
                      product={p}
                      onAddToCart={handleAddToCart}
                      onClick={(id) => router.push(`/product/${id}`)}
                    />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
