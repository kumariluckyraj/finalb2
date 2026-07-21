"use client";

import Link from "next/link";

interface ShipsFrom {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

interface SellerBadgeProps {
  sellerProfile: {
    id: string;
    businessName: string;
    businessLogoUrl?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  shipsFrom?: ShipsFrom | null;
}

export default function SellerBadge({
  sellerProfile,
  shipsFrom,
}: SellerBadgeProps) {
  if (!sellerProfile) return null;

  const linkHref = `/seller/${sellerProfile.id}`;

  // Build the full warehouse address line: "Street, City, State - Pincode"
  const hasShipsFromAddress = Boolean(
    shipsFrom?.address || shipsFrom?.city || shipsFrom?.state || shipsFrom?.pincode
  );

  const fullAddress = hasShipsFromAddress
    ? [
        shipsFrom?.address,
        [shipsFrom?.city, shipsFrom?.state].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(", ") + (shipsFrom?.pincode ? ` - ${shipsFrom.pincode}` : "")
    : [sellerProfile.city, sellerProfile.state].filter(Boolean).join(", ");

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 16px",
        background: "#f8fafc",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Seller Logo */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
          fontWeight: 700,
          color: "#64748b",
        }}
      >
        {sellerProfile.businessLogoUrl ? (
          <img
            src={sellerProfile.businessLogoUrl}
            alt={sellerProfile.businessName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          sellerProfile.businessName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Seller Info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginBottom: 2,
          }}
        >
          Sold by
        </div>

        <Link
          href={linkHref}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          {sellerProfile.businessName}
        </Link>

        {fullAddress && (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            📍 Ships from {fullAddress}
          </div>
        )}
      </div>
    </div>
  );
}