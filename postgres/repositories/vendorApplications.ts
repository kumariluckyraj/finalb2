import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateVendorApplicationInput, VendorApplicationRecord } from "../models/VendorApplication";

const applicationSelect = `
  SELECT
    id,
    name,
    email,
    password,
    mobile,
    gst_number AS "gstNumber",
    pan_number AS "panNumber",
    aadhaar_card_url AS "aadhaarCardUrl",
    gst_certificate_url AS "gstCertificateUrl",
    pan_card_url AS "panCardUrl",
    account_holder_name AS "accountHolderName",
    account_number AS "accountNumber",
    ifsc_code AS "ifscCode",
    store_name AS "storeName",
    store_description AS "storeDescription",
    store_logo_url AS "storeLogoUrl",
    store_banner_url AS "storeBannerUrl",
    product_category AS "productCategory",
    address_line1 AS "addressLine1",
    address_line2 AS "addressLine2",
    city,
    state,
    pincode,
    status,
    user_id AS "userId",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM vendor_applications
`;

export async function createVendorApplication(input: CreateVendorApplicationInput): Promise<VendorApplicationRecord> {
  const id = input.id ?? randomUUID();
  const { rows } = await query<VendorApplicationRecord>(
    `
      INSERT INTO vendor_applications (
        id, name, email, password, mobile, gst_number, pan_number, aadhaar_card_url,
        gst_certificate_url, pan_card_url, account_holder_name, account_number, ifsc_code,
        store_name, store_description, store_logo_url, store_banner_url, product_category,
        address_line1, address_line2, city, state, pincode, status, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING id, name, email, password, mobile, gst_number AS "gstNumber", pan_number AS "panNumber", aadhaar_card_url AS "aadhaarCardUrl", gst_certificate_url AS "gstCertificateUrl", pan_card_url AS "panCardUrl", account_holder_name AS "accountHolderName", account_number AS "accountNumber", ifsc_code AS "ifscCode", store_name AS "storeName", store_description AS "storeDescription", store_logo_url AS "storeLogoUrl", store_banner_url AS "storeBannerUrl", product_category AS "productCategory", address_line1 AS "addressLine1", address_line2 AS "addressLine2", city, state, pincode, status, user_id AS "userId", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      id,
      input.name,
      input.email,
      input.password,
      input.mobile,
      input.gstNumber,
      input.panNumber,
      input.aadhaarCardUrl,
      input.gstCertificateUrl,
      input.panCardUrl,
      input.accountHolderName,
      input.accountNumber,
      input.ifscCode,
      input.storeName,
      input.storeDescription ?? null,
      input.storeLogoUrl ?? null,
      input.storeBannerUrl ?? null,
      input.productCategory,
      input.addressLine1,
      input.addressLine2 ?? null,
      input.city,
      input.state,
      input.pincode,
      input.status ?? "pending",
      input.userId ?? null,
    ]
  );
  return rows[0];
}

export async function listVendorApplications(): Promise<VendorApplicationRecord[]> {
  const { rows } = await query<VendorApplicationRecord>(`${applicationSelect} ORDER BY created_at DESC`);
  return rows;
}

export async function findVendorApplicationById(id: string): Promise<VendorApplicationRecord | null> {
  const { rows } = await query<VendorApplicationRecord>(`${applicationSelect} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findVendorApplicationByEmail(email: string): Promise<VendorApplicationRecord | null> {
  const { rows } = await query<VendorApplicationRecord>(`${applicationSelect} WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function updateVendorApplicationStatus(id: string, status: VendorApplicationRecord["status"]): Promise<VendorApplicationRecord | null> {
  const { rows } = await query<VendorApplicationRecord>(
    `
      UPDATE vendor_applications
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, password, mobile, gst_number AS "gstNumber", pan_number AS "panNumber", aadhaar_card_url AS "aadhaarCardUrl", gst_certificate_url AS "gstCertificateUrl", pan_card_url AS "panCardUrl", account_holder_name AS "accountHolderName", account_number AS "accountNumber", ifsc_code AS "ifscCode", store_name AS "storeName", store_description AS "storeDescription", store_logo_url AS "storeLogoUrl", store_banner_url AS "storeBannerUrl", product_category AS "productCategory", address_line1 AS "addressLine1", address_line2 AS "addressLine2", city, state, pincode, status, user_id AS "userId", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function attachVendorUserId(id: string, userId: string): Promise<VendorApplicationRecord | null> {
  const { rows } = await query<VendorApplicationRecord>(
    `
      UPDATE vendor_applications
      SET user_id = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, password, mobile, gst_number AS "gstNumber", pan_number AS "panNumber", aadhaar_card_url AS "aadhaarCardUrl", gst_certificate_url AS "gstCertificateUrl", pan_card_url AS "panCardUrl", account_holder_name AS "accountHolderName", account_number AS "accountNumber", ifsc_code AS "ifscCode", store_name AS "storeName", store_description AS "storeDescription", store_logo_url AS "storeLogoUrl", store_banner_url AS "storeBannerUrl", product_category AS "productCategory", address_line1 AS "addressLine1", address_line2 AS "addressLine2", city, state, pincode, status, user_id AS "userId", created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function deleteVendorApplication(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM vendor_applications WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}
