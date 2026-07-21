import { SignJWT, jwtVerify } from "jose";
import { JwtPayload } from "@/types/auth";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as unknown as JwtPayload;
}