import ProductCatalog from "@/components/ProductCatalog";
import { Suspense } from "react";

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bannerImage?: string }> = {
  fashion: { label: "Fashion", icon: "", color: "#fdf2f8", bannerImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=2000" },
  mobile: { label: "Mobile", icon: "", color: "#eff6ff", bannerImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=2000" },
  beauty: { label: "Beauty", icon: "", color: "#fff7ed", bannerImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=2000" },
  electronics: { label: "Electronics", icon: "", color: "#f0fdf4", bannerImage: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=2000" },
  food: { label: "Food", icon: "", color: "#fef2f2", bannerImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000" },
  furniture: { label: "Furniture", icon: "", color: "#fefce8", bannerImage: "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?auto=format&fit=crop&q=80&w=2000" },
  sports: { label: "Sports", icon: "", color: "#f0fdfa", bannerImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=2000" },
  books: { label: "Books", icon: "", color: "#faf5ff", bannerImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000" },
};

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const meta = CATEGORY_META[category] || { label: category, icon: "", color: "#f5f5f5" };

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading {meta.label} catalog...</div>}>
      <ProductCatalog
        apiBase={`/api/products/${category}`}
        title={meta.label}
        subtitle={`Browse ${meta.label.toLowerCase()} products.`}
        accentLabel="Category"
        showSearch={false}
        bannerImage={meta.bannerImage}
      />
    </Suspense>
  );
}
