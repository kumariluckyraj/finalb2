"use client";

import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";

interface ProductData {
  _id: string;
  id: string;
  name: string;
  image: string;
  price: number;
  actualPrice: number;
  discount: number;
}

export default function ProductGrid({ products }: { products: ProductData[] }) {
  const router = useRouter();

  const handleClick = (id: string) => {
    router.push(`/product/${id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onClick={handleClick}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
