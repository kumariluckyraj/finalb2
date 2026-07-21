import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import type { OTPRecord, UpsertOTPInput } from "../models/OTP";

const otpSelect = `
  SELECT
    id,
    phone,
    otp,
    expires_at AS "expiresAt",
    verified,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM otps
`;

export async function upsertOtp(input: UpsertOTPInput): Promise<OTPRecord> {
  const { rows } = await query<OTPRecord>(
    `
      INSERT INTO otps (id, phone, otp, expires_at, verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (phone)
      DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, verified = EXCLUDED.verified, updated_at = now()
      RETURNING id, phone, otp, expires_at AS "expiresAt", verified, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [randomUUID(), input.phone, input.otp, input.expiresAt, input.verified ?? false]
  );
  return rows[0];
}

export async function findOtpByPhone(phone: string): Promise<OTPRecord | null> {
  const { rows } = await query<OTPRecord>(`${otpSelect} WHERE phone = $1`, [phone]);
  return rows[0] ?? null;
}

export async function markOtpVerified(phone: string): Promise<OTPRecord | null> {
  const { rows } = await query<OTPRecord>(
    `
      UPDATE otps
      SET verified = true, updated_at = now()
      WHERE phone = $1
      RETURNING id, phone, otp, expires_at AS "expiresAt", verified, created_at AS "createdAt", updated_at AS "updatedAt"
    `,
    [phone]
  );
  return rows[0] ?? null;
}

export async function deleteExpiredOtps(now = new Date()): Promise<number> {
  const { rowCount } = await query(`DELETE FROM otps WHERE expires_at < $1`, [now]);
  return rowCount ?? 0;
}
