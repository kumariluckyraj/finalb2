"use client";
import Image from "next/image";

interface ProductData {
  _id: string;
  id: string;
  name: string;
  image: string;
  hoverImage?: string;
  price: number;
  actualPrice: number;
  discount: number;
  category?: string;
  brand?: string;
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-[#eef1f0] rounded-lg mb-3" />
      <div className="h-4 bg-[#eef1f0] rounded w-4/5 mb-2" />
      <div className="h-3 bg-[#eef1f0] rounded w-1/3 mb-2" />
      <div className="h-4 bg-[#eef1f0] rounded w-2/5" />
    </div>
  );
}

export default function ProductCard({
  product,
  onAddToCart,
  onClick,
}: {
  product: ProductData;
  onAddToCart: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string) => void;
}) {
  // If no specific hover image is provided, generate a fallback variation of the same image for demonstration,
  // or just use the same image if it's not a generic URL.
  const hoverImg = product.hoverImage || (product.image && product.image.includes("unsplash.com") ? `${product.image}&auto=format&fit=crop&w=800&q=80&sig=${product._id}` : product.image);

  return (
    <div
      onClick={() => onClick(product._id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(product._id); } }}
      role="button"
      tabIndex={0}
      className="cursor-pointer group"
    >
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#eef1f0] mb-3">
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
              loading="lazy"
            />
            <Image
              src={hoverImg}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
              className="absolute inset-0 transition-transform duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-105"
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#606562] text-xs">No image</div>
        )}
        {/* New/discount badge */}
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-[#4e4e4e] text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10"
            style={{ letterSpacing: '0.02em' }}>
            {product.discount}% OFF
          </div>
        )}
        {/* Quick add button on hover */}
        <button
          aria-label={`Add ${product.name} to cart`}
          onClick={(e) => onAddToCart(e, product._id)}
          className="absolute bottom-3 right-3 z-10 bg-[#1a211e] text-white text-[11px] font-bold uppercase px-4 py-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer border-none hover:bg-[#363537]"
          style={{ letterSpacing: '0.057em' }}
        >
          + Add
        </button>
      </div>

      {/* Product info */}
      <h3 className="text-[15px] font-normal text-[#1a211e] m-0 mb-1 leading-snug line-clamp-2">
        {product.name}
      </h3>
      <p className="text-[13px] text-[#606562] m-0 mb-1 font-normal">
        {product.category || product.brand || "B2World"}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-normal text-[#1a211e]">
          ₹{product.price?.toLocaleString("en-IN")}
        </span>
        {product.actualPrice > product.price && (
          <span className="text-[13px] text-[#cccfcd] line-through">
            ₹{product.actualPrice?.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}
