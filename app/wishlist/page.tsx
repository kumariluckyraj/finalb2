"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  actualPrice?: number;
  image: string;
  stock?: number;
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/me");
      if (!me.ok) {
        router.replace("/login");
        return;
      }
      const { productIds = [] } = await fetch("/api/wishlist").then(r => r.json());
      const products = await Promise.all(productIds.map(async (id: string) => {
        const res = await fetch(`/api/products/detail/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.product as Product;
      }));
      setItems(products.filter(Boolean) as Product[]);
      setLoading(false);
    })();
  }, [router]);

  const remove = async (id: string) => {
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
    setItems(prev => prev.filter(item => item._id !== id));
  };

  if (loading) return <div className="min-h-screen bg-[#f8f9f8] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#1a211e] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9f8] font-sans text-[#1a211e] p-6 pt-16">
      <div className="max-w-[1180px] mx-auto">
        <h1 className="m-0 mb-2 text-[32px] md:text-[40px] display-serif">Wishlist</h1>
        <p className="m-0 mb-8 text-[14px] text-[#606562]">Your saved products.</p>

        {items.length === 0 ? (
          <div className="bg-white border border-[#e0e0e0] p-12 text-center">
            <div className="text-[42px] mb-4 text-[#cccfcd]">♡</div>
            <h2 className="mb-2 text-lg font-normal font-serif">No saved items yet</h2>
            <button onClick={() => router.push("/products")} className="mt-4 bg-[#1a211e] text-white border-none px-6 py-3 rounded text-[13px] uppercase tracking-[0.05em] font-bold cursor-pointer hover:bg-[#363537] transition-colors">Browse gear</button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-6">
            {items.map(p => (
              <div key={p._id} className="bg-white border border-[#e0e0e0] overflow-hidden group">
                <div className="relative bg-[#eef1f0] overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-[240px] object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-[240px] flex items-center justify-center text-[#606562] text-xs">No image</div>
                  )}
                  <button onClick={() => remove(p._id)} className="absolute top-2 right-2 bg-white text-[#1a211e] w-8 h-8 rounded-full flex items-center justify-center border border-[#e0e0e0] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold">×</button>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#606562] mb-1">{p.category}</div>
                  <div className="text-[14px] font-normal mt-1.5 text-[#1a211e] mb-2 leading-snug line-clamp-2 min-h-[40px]">{p.name}</div>
                  <div className="flex gap-2 items-baseline mb-4">
                    <span className="font-normal text-[#1a211e] text-[15px]">₹{Number(p.price).toLocaleString("en-IN")}</span>
                    {p.actualPrice && <span className="text-[13px] text-[#cccfcd] line-through">₹{Number(p.actualPrice).toLocaleString("en-IN")}</span>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => router.push(`/product/${p._id}`)} className="w-full bg-white text-[#1a211e] border border-[#cccfcd] py-2 px-3 rounded text-[12px] uppercase tracking-[0.05em] font-bold cursor-pointer hover:border-[#1a211e] transition-colors">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
