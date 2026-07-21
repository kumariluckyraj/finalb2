import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { CreateSellerBankAccountInput, SellerBankAccountRecord } from "../models/SellerBankAccount";

const bankSelect = `
  SELECT
    id,
    seller_id AS "sellerId",
    account_holder_name AS "accountHolderName",
    account_number AS "accountNumber",
    confirm_account_number AS "confirmAccountNumber",
    ifsc_code AS "ifscCode",
    bank_name AS "bankName",
    account_type AS "accountType",
    is_primary AS "isPrimary",
    verified,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM seller_bank_accounts
`;

export async function createBankAccount(input: CreateSellerBankAccountInput): Promise<SellerBankAccountRecord> {
  const { rows } = await query<SellerBankAccountRecord>(
    `
      INSERT INTO seller_bank_accounts (id, seller_id, account_holder_name, account_number, confirm_account_number, ifsc_code, bank_name, account_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, seller_id AS "sellerId", account_holder_name AS "accountHolderName", account_number AS "accountNumber", confirm_account_number AS "confirmAccountNumber", ifsc_code AS "ifscCode", bank_name AS "bankName", account_type AS "accountType", is_primary AS "isPrimary", verified, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      randomUUID(),
      input.sellerId,
      input.accountHolderName,
      input.accountNumber,
      input.confirmAccountNumber,
      input.ifscCode,
      input.bankName ?? null,
      input.accountType ?? "savings",
    ]
  );
  return rows[0];
}

export async function findBankAccountBySellerId(sellerId: string): Promise<SellerBankAccountRecord | null> {
  const { rows } = await query<SellerBankAccountRecord>(`${bankSelect} WHERE seller_id = $1`, [sellerId]);
  return rows[0] ?? null;
}

export async function updateBankAccount(sellerId: string, patch: Partial<CreateSellerBankAccountInput & { isPrimary: boolean; verified: boolean }>): Promise<SellerBankAccountRecord | null> {
  const existing = await findBankAccountBySellerId(sellerId);
  if (!existing) return null;

  const next = { ...existing, ...patch };
  const { rows } = await query<SellerBankAccountRecord>(
    `
      UPDATE seller_bank_accounts
      SET
        account_holder_name = $2,
        account_number = $3,
        confirm_account_number = $4,
        ifsc_code = $5,
        bank_name = $6,
        account_type = $7,
        is_primary = $8,
        verified = $9,
        updated_at = now()
      WHERE seller_id = $1
      RETURNING id, seller_id AS "sellerId", account_holder_name AS "accountHolderName", account_number AS "accountNumber", confirm_account_number AS "confirmAccountNumber", ifsc_code AS "ifscCode", bank_name AS "bankName", account_type AS "accountType", is_primary AS "isPrimary", verified, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [
      existing.id,
      next.accountHolderName,
      next.accountNumber,
      next.confirmAccountNumber,
      next.ifscCode,
      next.bankName ?? null,
      next.accountType,
      next.isPrimary,
      next.verified,
    ]
  );
  return rows[0] ?? null;
}
