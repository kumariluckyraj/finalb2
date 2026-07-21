import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { JwtPayload } from "@/types/auth";

export async function getAuthUser(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    return await verifyToken(token);
  } catch {
    return null;
  }
}