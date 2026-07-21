// lib/sms.ts
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendOTP(phone: string, otp: string) {
  await client.messages.create({
    body: `Your OTP is ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER!, // e.g. +12015551234
    to: `+91${phone}`,  // assuming 10-digit Indian numbers
  });
}