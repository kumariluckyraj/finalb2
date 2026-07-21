import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateSellerProfileInput, SellerProfileRecord } from "../models/SellerProfile";

const sellerProfileSelect = `
  SELECT
    id,
    user_id AS "userId",
    business_name AS "businessName",
    business_type AS "businessType",
    phone,
    address_line1 AS "addressLine1",
    address_line2 AS "addressLine2",
    city,
    state,
    pincode,
    gst_pan AS "gstPan",
    business_logo_url AS "businessLogoUrl",
    onboarding_step AS "onboardingStep",
    onboarding_completed AS "onboardingCompleted",
    status,
    kyc_status AS "kycStatus",
    kyc_method AS "kycMethod",
    pan_number AS "panNumber",
    gst_number AS "gstNumber",
    kyc_verified_at AS "kycVerifiedAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM seller_profiles
`;

export async function createSellerProfile(input: CreateSellerProfileInput): Promise<SellerProfileRecord> {
  const { rows } = await query<SellerProfileRecord>(
    `
      INSERT INTO seller_profiles (id, user_id, business_name, business_type, phone, address_line1, address_line2, city, state, pincode, gst_pan, business_logo_url, pan_number, gst_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, user_id AS "userId", business_name AS "businessName", business_type AS "businessType", phone, address_line1 AS "addressLine1", address_line2 AS "addressLine2", city, state, pincode, gst_pan AS "gstPan", business_logo_url AS "businessLogoUrl", onboarding_step AS "onboardingStep", onboarding_completed AS "onboardingCompleted", status, kyc_status AS "kycStatus", kyc_method AS "kycMethod", pan_number AS "panNumber", gst_number AS "gstNumber", kyc_verified_at AS "kycVerifiedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.userId,
      input.businessName,
      input.businessType,
      input.phone,
      input.addressLine1,
      input.addressLine2 ?? null,
      input.city,
      input.state,
      input.pincode,
      input.gstPan ?? null,
      input.businessLogoUrl ?? null,
      input.panNumber ?? null,
      input.gstNumber ?? null,
    ]
  );
  return rows[0];
}

export async function findSellerProfileByUserId(userId: string): Promise<SellerProfileRecord | null> {
  const { rows } = await query<SellerProfileRecord>(`${sellerProfileSelect} WHERE user_id = $1`, [userId]);
  return rows[0] ?? null;
}

export async function findSellerProfileById(id: string): Promise<SellerProfileRecord | null> {
  const { rows } = await query<SellerProfileRecord>(`${sellerProfileSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateSellerProfile(id: string, patch: Partial<CreateSellerProfileInput & { onboardingStep: number; onboardingCompleted: boolean; status: string; kycStatus: string; kycMethod: string; kycVerifiedAt: Date | null }>): Promise<SellerProfileRecord | null> {
  const existing = await findSellerProfileById(id);
  if (!existing) return null;

  const next = { ...existing, ...patch };
  const { rows } = await query<SellerProfileRecord>(
    `
      UPDATE seller_profiles
      SET
        business_name = $2,
        business_type = $3,
        phone = $4,
        address_line1 = $5,
        address_line2 = $6,
        city = $7,
        state = $8,
        pincode = $9,
        gst_pan = $10,
        business_logo_url = $11,
        onboarding_step = $12,
        onboarding_completed = $13,
        status = $14,
        kyc_status = $15,
        kyc_method = $16,
        pan_number = $17,
        gst_number = $18,
        kyc_verified_at = $19,
        updated_at = now()
      WHERE id = $1
      RETURNING id, user_id AS "userId", business_name AS "businessName", business_type AS "businessType", phone, address_line1 AS "addressLine1", address_line2 AS "addressLine2", city, state, pincode, gst_pan AS "gstPan", business_logo_url AS "businessLogoUrl", onboarding_step AS "onboardingStep", onboarding_completed AS "onboardingCompleted", status, kyc_status AS "kycStatus", kyc_method AS "kycMethod", pan_number AS "panNumber", gst_number AS "gstNumber", kyc_verified_at AS "kycVerifiedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      next.businessName,
      next.businessType,
      next.phone,
      next.addressLine1,
      next.addressLine2 ?? null,
      next.city,
      next.state,
      next.pincode,
      next.gstPan ?? null,
      next.businessLogoUrl ?? null,
      next.onboardingStep,
      next.onboardingCompleted,
      next.status,
      next.kycStatus ?? "pending",
      next.kycMethod ?? "manual",
      next.panNumber ?? null,
      next.gstNumber ?? null,
      next.kycVerifiedAt ?? null,
    ]
  );
  return rows[0] ?? null;
}
