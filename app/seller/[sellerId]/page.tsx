import { notFound } from "next/navigation";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { listProductsByVendor } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";
import ProductGrid from "@/components/ProductGrid";

export default async function SellerPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = await params;
  const sellerProfile = await findSellerProfileById(sellerId);
  if (!sellerProfile) notFound();

  const products = await listProductsByVendor(sellerProfile.userId);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          padding: "24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: "#64748b",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {sellerProfile.businessLogoUrl ? (
            <img
              src={sellerProfile.businessLogoUrl}
              alt={sellerProfile.businessName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            sellerProfile.businessName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {sellerProfile.businessName}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            {(sellerProfile.city ?? "") + ", " + (sellerProfile.state ?? "")} &middot; {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Products by {sellerProfile.businessName}
      </h2>
      {products.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No products yet.</p>
      ) : (
        <ProductGrid products={products.map(toApiProduct).filter((p): p is NonNullable<typeof p> => p !== null)} />
      )}
    </div>
  );
}
