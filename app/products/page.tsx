import ProductCatalog from "@/components/ProductCatalog";
import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading catalog...</div>}>
      <ProductCatalog
        apiBase="/api/products"
        title="All Products"
        subtitle="Search, filter, and sort the full catalog."
        accentLabel="Catalog"
      />
    </Suspense>
  );
}
