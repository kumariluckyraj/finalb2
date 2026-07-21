import { notFound } from "next/navigation";
import { findStoreBySlug } from "@/postgres/repositories/stores";
import { findSellerProfileById } from "@/postgres/repositories/sellerProfiles";
import { listProductsByVendor } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";
import ProductGrid from "@/components/ProductGrid";

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await findStoreBySlug(slug);
  if (!store) notFound();

  const sellerProfile = await findSellerProfileById(store.sellerId);
  if (!sellerProfile) notFound();

  const products = await listProductsByVendor(sellerProfile.userId);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {store.bannerUrl && (
        <div
          style={{
            width: "100%",
            height: 200,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 24,
            background: "#f1f5f9",
          }}
        >
          <img
            src={store.bannerUrl}
            alt={store.storeName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

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
            {store.storeName}
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            by {sellerProfile.businessName} &middot; {(sellerProfile.city ?? "") + ", " + (sellerProfile.state ?? "")} &middot; {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
          {store.description && (
            <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
              {store.description}
            </p>
          )}
        </div>
      </div>

      {(store.shippingPolicy || store.returnPolicy) && (
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            padding: "16px 24px",
            marginBottom: 24,
            display: "flex",
            gap: 32,
            fontSize: 14,
          }}
        >
          {store.shippingPolicy && (
            <div>
              <strong style={{ color: "#1a211e" }}>Shipping Policy</strong>
              <p style={{ margin: "4px 0 0", color: "#475569" }}>{store.shippingPolicy}</p>
            </div>
          )}
          {store.returnPolicy && (
            <div>
              <strong style={{ color: "#1a211e" }}>Return Policy</strong>
              <p style={{ margin: "4px 0 0", color: "#475569" }}>{store.returnPolicy}</p>
            </div>
          )}
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Products
      </h2>
      {products.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No products yet.</p>
      ) : (
        <ProductGrid products={products.map(toApiProduct).filter((p): p is NonNullable<typeof p> => p !== null)} />
      )}
    </div>
  );
}
