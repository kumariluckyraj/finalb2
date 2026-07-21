"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readStringArray, writeStringArray } from "@/lib/clientStorage";

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  actualPrice?: number;
  image: string;
  stock?: number;
  brand?: string;
  flavor?: string;
  author?: string;
  material?: string;
  size?: string;
  description?: string;
};

const rows: Array<{ label: string; key: keyof Product }> = [
  { label: "Price", key: "price" },
  { label: "MRP", key: "actualPrice" },
  { label: "Stock", key: "stock" },
  { label: "Brand", key: "brand" },
  { label: "Size", key: "size" },
  { label: "Material", key: "material" },
  { label: "Flavor", key: "flavor" },
  { label: "Author", key: "author" },
];

export default function ComparePage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const ids = readStringArray("b2world_compare");
    const products = await Promise.all(ids.map(async (id) => {
      const res = await fetch(`/api/products/detail/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.product as Product;
    }));
    setItems(products.filter(Boolean) as Product[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const remove = (id: string) => {
    const next = readStringArray("b2world_compare").filter((item) => item !== id);
    writeStringArray("b2world_compare", next);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f9f8] font-sans text-[#1a211e] p-6 pt-16">
      <div className="max-w-[1280px] mx-auto">
        <h1 className="m-0 mb-2 text-[32px] md:text-[40px] display-serif text-[#1a211e]">Compare</h1>
        <p className="m-0 mb-8 text-[14px] text-[#606562]">Side-by-side technical comparison for your shortlist.</p>

        {loading ? (
          <div className="bg-white border border-[#e0e0e0] p-6 text-[13px] font-medium uppercase tracking-[0.05em] text-[#606562]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#e0e0e0] p-12 text-center">
            <div className="text-[42px] mb-4 text-[#cccfcd]">⚖</div>
            <h2 className="mb-2 text-lg font-normal font-serif">No items to compare</h2>
            <button onClick={() => router.push("/products")} className="mt-4 bg-[#1a211e] text-white border-none px-6 py-3 rounded text-[13px] uppercase tracking-[0.05em] font-bold cursor-pointer hover:bg-[#363537] transition-colors">Browse gear</button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-[#e0e0e0]">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "20px 24px", borderBottom: "1px solid #1a211e", borderRight: "1px solid #e0e0e0", width: "200px" }}>
                    <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#606562]">Feature</span>
                  </th>
                  {items.map((item) => (
                    <th key={item._id} style={{ padding: "20px 24px", borderBottom: "1px solid #1a211e", borderRight: "1px solid #e0e0e0", verticalAlign: "top" }}>
                      <div className="relative group">
                        <button onClick={() => remove(item._id)} className="absolute -top-2 -right-2 bg-white text-[#1a211e] w-8 h-8 rounded-full flex items-center justify-center border border-[#e0e0e0] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10 hover:bg-[#f8f9f8]">×</button>
                        <div className="bg-[#eef1f0] aspect-square rounded overflow-hidden mb-4 relative cursor-pointer" onClick={() => router.push(`/product/${item._id}`)}>
                          <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#606562] mb-1 text-left">{item.category}</div>
                        <div className="font-normal text-[#1a211e] text-[15px] leading-snug text-left cursor-pointer hover:underline underline-offset-2" onClick={() => router.push(`/product/${item._id}`)}>{item.name}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.label}>
                    <td style={{ padding: "16px 24px", borderBottom: index === rows.length - 1 ? "none" : "1px solid #e0e0e0", borderRight: "1px solid #e0e0e0", background: "#fafafa" }}>
                      <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-[#1a211e]">{row.label}</span>
                    </td>
                    {items.map((item) => (
                      <td key={item._id + row.label} style={{ padding: "16px 24px", borderBottom: index === rows.length - 1 ? "none" : "1px solid #e0e0e0", borderRight: "1px solid #e0e0e0", color: "#1a211e", fontSize: "14px" }}>
                        {row.key === "price" || row.key === "actualPrice"
                          ? item[row.key] ? `₹${Number(item[row.key]).toLocaleString("en-IN")}` : <span className="text-[#cccfcd]">—</span>
                          : row.key === "stock"
                            ? typeof item.stock === "number"
                              ? item.stock > 0 ? <span className="text-[#606562]">{item.stock} in stock</span> : <span className="text-[#ef4444]">Out of stock</span>
                              : <span className="text-[#cccfcd]">Not tracked</span>
                            : item[row.key] || <span className="text-[#cccfcd]">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
