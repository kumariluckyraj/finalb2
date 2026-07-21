"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import HeroBanner from "@/components/HeroBanner";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";
import TrustBadges from "@/components/TrustBadges";

const CATEGORIES = [
  { id: "fashion",     label: "Fashion",      img: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80" },
  { id: "mobile",      label: "Mobiles",      img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80" },
  { id: "beauty",      label: "Beauty",       img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80" },
  { id: "electronics", label: "Electronics",  img: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80" },
  { id: "food",        label: "Grocery",      img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" },
  { id: "furniture",   label: "Furniture",    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80" },
  { id: "sports",      label: "Sports",       img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80" },
  { id: "books",       label: "Books",        img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80" },
];

const BANNERS = [
  {
    bg: "",
    eyebrow: "LIMITED TIME",
    title: "Up to 80% Off on Electronics",
    sub: "Discover premium electronics and accessories at unbeatable prices. Free delivery on all orders.",
    cta: "Shop Now",
    imgUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80",
    link: "/products/electronics",
  },
  {
    bg: "",
    eyebrow: "NEW COLLECTION",
    title: "Fashion That Speaks",
    sub: "Top branded clothing and footwear. Curated styles for every occasion.",
    cta: "Explore Now",
    imgUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    link: "/products/fashion",
  },
  {
    bg: "",
    eyebrow: "FRESH ARRIVALS",
    title: "Fresh Every Day",
    sub: "Premium groceries delivered to your door. Quality you can taste.",
    cta: "Order Now",
    imgUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
    link: "/products/food",
  },
];

const STRINGS = {
  searchPlaceholder: "Search products, brands and more",
};

export default function HomePage() {
  const router = useRouter();
  const { isTranslating } = useTranslation("dashboard", STRINGS);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        setFeatured(d.products?.slice(0, 12) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("recent_products") || "[]");
      setRecent(r);
    } catch {
      console.error("Failed to parse recent_products from localStorage");
    }
  }, []);

  const [cartToast, setCartToast] = useState<string | null>(null);

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
        router.push("/login?redirect=/");
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
      setCartToast("Failed to add item. Please try again.");
      setTimeout(() => setCartToast(null), 3000);
    }
  };

  return (
    <>
      {/* Toast notification */}
      {cartToast && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000,
          background: cartToast.includes("Failed") ? "#cc2e39" : "#1a211e",
          color: "#fff",
          padding: "12px 28px", borderRadius: 4, fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
          letterSpacing: '0.02em',
          animation: 'fadeIn 0.2s ease',
        }}>
          {cartToast.includes("Failed") ? "✕" : "✓"} {cartToast}
        </div>
      )}

      <div className={`min-h-screen bg-white font-sans text-[#1a211e] transition-opacity duration-200 ${isTranslating ? "opacity-85" : "opacity-100"}`}>

        {/* Section 1: Hero Split Panel */}
        <HeroBanner banners={BANNERS} onNavigate={(p) => router.push(p)} />

        {/* Section 2: Featured Products Carousel */}
        <FeaturedProducts
          products={featured}
          loading={loading}
          onAddToCart={handleAddToCart}
          onViewAll={() => router.push("/products")}
          onProductClick={(id) => router.push(`/product/${id}`)}
        />

        {/* Divider */}
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="h-px bg-[#e0e0e0]" />
        </div>

        {/* Section 3: Explore Categories */}
        <CategoryGrid
          categories={CATEGORIES}
          onCategoryClick={(id) => router.push(id ? `/products/${id}` : "/products")}
        />

        {/* Section 4: Promotional Editorial Banner */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: '50vh' }}>
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
            alt="Shop with confidence"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-[#0c0c0c]/60" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-24 min-h-[50vh]">
            <h2
              className="display-serif text-white m-0 mb-6 max-w-[700px]"
              style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
            >
              Shop with confidence
            </h2>
            <p className="text-white/70 text-[16px] m-0 mb-8 max-w-[500px] leading-relaxed">
              Every product on B2World is backed by our quality guarantee. From fashion to electronics, we curate the best for you.
            </p>
            <button
              onClick={() => router.push("/products")}
              className="bg-white text-[#1a211e] border-none px-8 py-3.5 rounded text-[14px] font-bold uppercase cursor-pointer transition-opacity hover:opacity-90"
              style={{ letterSpacing: '0.057em' }}
            >
              Shop All Products
            </button>
          </div>
        </section>

        {/* Section 5: Trust/Brand Story */}
        <TrustBadges />

        {/* Section 6: Recently Viewed */}
        <RecentlyViewed
          products={recent}
          onProductClick={(id) => router.push(`/product/${id}`)}
        />

        {/* Section 7: Newsletter CTA */}
        <section className="py-16 md:py-24 bg-[#0c0c0c]">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 text-center">
            <h2
              className="display-serif text-white m-0 mb-4"
              style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}
            >
              Stay in the loop
            </h2>
            <p className="text-white/50 text-[15px] m-0 mb-8 max-w-[400px] mx-auto leading-relaxed">
              Sign up for updates on new arrivals, exclusive deals, and B2World stories.
            </p>
            <div className="flex justify-center gap-3 max-w-[480px] mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 h-12 px-4 rounded bg-white/10 border border-white/20 text-white text-[14px] outline-none placeholder:text-white/40 focus:border-white/50 transition-colors"
              />
              <button
                className="h-12 px-6 bg-white text-[#1a211e] border-none rounded text-[13px] font-bold uppercase cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                style={{ letterSpacing: '0.057em' }}
              >
                Sign Me Up
              </button>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
