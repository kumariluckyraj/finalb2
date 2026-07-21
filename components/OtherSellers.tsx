"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type SellerListing = {
  sellerProductId: string;
  sellerId: string;
  storeName: string;
  storeId: string | null;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  image: string;
  shipsToUser: boolean | null;
  distanceLabel: string | null;
  isCheapest: boolean;
};

type SellersResponse = {
  listings: SellerListing[];
  cheapestPrice: number | null;
  currentProductId: string;
  currentIsCheapest: boolean;
};

export default function OtherSellers({ productId }: { productId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/sellers/${productId}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setData(null);
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="py-10 px-5 max-w-[1440px] mx-auto border-b border-[#e0e0e0]">
        <div className="h-5 w-48 bg-[#eef1f0] rounded animate-pulse mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 border-t border-[#eef1f0]">
            <div className="w-12 h-12 bg-[#eef1f0] rounded animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-[#eef1f0] rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-[#eef1f0] rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-[#eef1f0] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.listings.length === 0) return null;

  const savings = data.currentIsCheapest
    ? null
    : data.listings[0].price;

  return (
    <div className="py-10 px-5 max-w-[1440px] mx-auto border-b border-[#e0e0e0]">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer text-left"
      >
        <h2 className="text-[20px] font-serif text-[#1a211e]">
          Compare prices from {data.listings.length} other seller{data.listings.length > 1 ? "s" : ""}
        </h2>
        <span className={`text-[#606562] transition-transform ${collapsed ? "rotate-0" : "rotate-180"}`}>
          ▼
        </span>
      </button>

      {!collapsed && (
        <div className="mt-4">
          {savings && (
            <p className="text-[14px] text-[#cc2e39] font-medium mb-4">
              You could save ₹{(savings - data.listings[0].price).toLocaleString("en-IN")}
            </p>
          )}

          <div className="space-y-px">
            {data.listings.map((l) => (
              <button
                key={l.sellerProductId}
                onClick={() => router.push(`/product/${l.sellerProductId}`)}
                disabled={l.stock < 1}
                className="w-full flex items-center gap-4 px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-[#f5f6f5] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative w-12 h-12 bg-[#eef1f0] rounded-[6px] overflow-hidden shrink-0">
                  {l.image && (
                    <Image src={l.image} alt="" fill sizes="48px" style={{ objectFit: "contain", padding: "4px" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#1a211e] truncate">{l.storeName}</span>
                    {l.isCheapest && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-white bg-[#cc2e39] px-1.5 py-0.5 rounded-[3px] shrink-0">Cheapest</span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#606562] mt-0.5">
                    {l.distanceLabel && `Ships from ${l.distanceLabel}`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[16px] font-bold text-[#1a211e]">₹{l.price.toLocaleString("en-IN")}</div>
                  {l.mrp > l.price && (
                    <div className="text-[11px] text-[#606562] line-through">₹{l.mrp.toLocaleString("en-IN")}</div>
                  )}
                </div>

                <div className="w-8 shrink-0 text-center">
                  {l.shipsToUser === true && (
                    <span className="text-[16px]" title="Ships to your location">✓</span>
                  )}
                  {l.shipsToUser === false && (
                    <span className="text-[14px] text-[#606562]" title="Does not ship to your location">✗</span>
                  )}
                  {l.shipsToUser === null && (
                    <span className="text-[10px] text-[#606562] uppercase tracking-[0.05em]">—</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
